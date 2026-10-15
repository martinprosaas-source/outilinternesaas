// Les boutons d'action d'un dossier, les mêmes partout (Mes tâches, tableau, page dossier).
// Chaque action fait avancer le dossier d'un clic ; celles qui demandent une précision ouvrent une petite fenêtre.
import { useState } from 'react'
import { aujourdhui, decalerJour, euros } from '../lib.js'
import { useStore } from '../store.jsx'
import { Bouton, Champ, Fenetre, Presence, TexteLibre } from '../ui.jsx'
import { useImpression } from './DevisPDF.jsx'
import * as W from '../workflow.js'

// run : (dossier, moi) → dossier suivant. ouvrir : onglet du dossier à ouvrir. fenetre : précision à demander.
export const ACTIONS = {
  contacter: { label: 'Contacté', icone: 'coche', run: W.contacter, toast: 'Contacté · relance prévue dans 3 jours' },
  relancer: { label: 'Relancé', icone: 'reponse', run: W.relancerProspect, toast: 'Relance notée · prochaine dans 3 jours' },
  planifier: { label: 'Planifier le call', icone: 'calendrier', fenetre: 'planifier' },
  call_fait: { label: 'Call fait', icone: 'coche', run: (d, m) => W.changerStatutProspect(d, 'call_fait', m), toast: 'Call fait' },
  passer_audit: { label: 'Signé : passer à Hugo', icone: 'fleche', run: W.passerAudit, toast: 'Dossier passé à Hugo pour l’audit', ouvrirApres: 'audit' },
  perdu: { label: 'Perdu', icone: 'attention', fenetre: 'perdu' },
  ouvrir_audit: { label: 'Ouvrir l’audit', icone: 'fleche', ouvrir: 'audit' },
  envoyer_revue: { label: 'Envoyer en revue à Martin', icone: 'envoyer', run: W.soumettreAudit, toast: 'Audit envoyé en revue à Martin' },
  ouvrir_revue: { label: 'Faire la revue', icone: 'fleche', ouvrir: 'audit' },
  valider_audit: { label: 'Valider l’audit', icone: 'coche', valider: true, toast: 'Audit validé : le devis est prérempli', ouvrirApres: 'devis' },
  renvoyer: { label: 'Renvoyer à Hugo', icone: 'reponse', fenetre: 'renvoyer' },
  ouvrir_devis: { label: 'Ouvrir le devis', icone: 'fleche', ouvrir: 'devis' },
  soumettre_devis: { label: 'Soumettre à l’équipe', icone: 'envoyer', run: W.soumettreDevis, toast: 'Devis soumis à Nino et Hugo' },
  valider: { label: 'Je valide', icone: 'pouce', variante: 'vert', run: W.voterDevis, toast: 'Devis validé' },
  modif: { label: 'Demander une modif', icone: 'reponse', fenetre: 'modif' },
  envoyer: { label: 'Envoyé au client', icone: 'envoyer', run: W.envoyerDevis, toast: 'Devis chez le client · Nino suit la signature' },
  pdf: { label: 'PDF', icone: 'imprimer', pdf: true },
  relancer_client: { label: 'Relancé', icone: 'reponse', run: W.relancerClient, toast: 'Relance du client notée' },
  accepte: { label: 'Accepté', icone: 'pouce', run: W.accepterDevis, toast: 'Devis accepté' },
  modif_client: { label: 'Il veut une modif', icone: 'reponse', fenetre: 'modif' },
  signer: { label: 'Contrat signé', icone: 'stylo', fenetre: 'signer' },
  ouvrir_delivery: { label: 'Ouvrir le projet', icone: 'fleche', ouvrir: 'delivery' },
  livrer: { label: 'Projet livré', icone: 'fusee', variante: 'vert', run: W.livrer, toast: 'Projet livré 🎉' },
}

// taille 'sm' (listes) ou 'md' (carte d'action). Le premier bouton est le principal.
// suivre : après l'action, ouvrir l'onglet de la nouvelle étape (page dossier). Dans les listes, on reste sur place.
export function BoutonsAction({ d, ids, taille = 'sm', sombre = false, aller, onFait, suivre = false }) {
  const { agir, moi, prochainNumero } = useStore()
  const [fenetre, setFenetre] = useState(null)
  const [pdf, imprimer] = useImpression(d)

  const lancer = (id) => {
    const a = ACTIONS[id]
    if (a.ouvrir) return aller(`dossier/${d.id}/${a.ouvrir}`)
    if (a.fenetre) return setFenetre(id === 'modif_client' ? 'modif' : a.fenetre)
    if (a.pdf) return imprimer()
    let run = a.run
    if (a.valider) {
      // Le numéro de devis n'est réservé que si la validation peut passer.
      const pret = W.pretAValider(d.audit)
      const numero = d.devis?.numero || (pret ? prochainNumero() : null)
      run = (x, m) => W.validerAudit(x, m, numero)
    }
    if (agir(d.id, (x) => run(x, moi.id), a.toast)) {
      onFait?.(id)
      if (a.ouvrirApres && suivre && aller) aller(`dossier/${d.id}/${a.ouvrirApres}`)
    }
  }

  // Les clics (y compris dans les fenêtres, rendues en portail) ne remontent pas jusqu'à la ligne qui ouvre le dossier.
  return (
    <div className="contents" onClick={(e) => e.stopPropagation()}>
      <div className="flex flex-wrap items-center gap-1.5">
        {ids.map((id, i) => {
          const a = ACTIONS[id]
          const principal = i === 0
          const variante = principal ? a.variante || 'principal' : sombre ? 'discret' : 'secondaire'
          return (
            <Bouton key={id} taille={taille} icone={a.icone} variante={variante} onClick={() => lancer(id)}
              className={!principal && sombre ? '!text-papier/75 hover:!bg-white/10 hover:!text-papier' : ''}>
              {a.label}
            </Bouton>
          )
        })}
      </div>
      {pdf}
      <Presence>
        {fenetre && <FenetreAction type={fenetre} d={d} onFermer={() => setFenetre(null)} onFait={(id) => { setFenetre(null); onFait?.(id) }} aller={suivre ? aller : null} />}
      </Presence>
    </div>
  )
}

function FenetreAction({ type, d, onFermer, onFait, aller }) {
  const { agir, moi } = useStore()
  const [texte, setTexte] = useState('')
  const [date, setDate] = useState(d.prospection?.callLe || decalerJour(aujourdhui(), 1))
  const titre = d.business || d.nom
  const faire = (fn, toast, id, apres) => { if (agir(d.id, (x) => fn(x, moi.id), toast)) { onFait(id); if (apres && aller) aller(apres) } }

  if (type === 'planifier') {
    return (
      <Fenetre surtitre={titre} titre="Planifier le call" onFermer={onFermer}
        actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton icone="calendrier" onClick={() => faire((x, m) => W.planifierCall(x, m, date), 'Call planifié', 'planifier')}>Planifier</Bouton></>}>
        <Champ label="Date du call"><input type="date" autoFocus className="champ" value={date} onChange={(e) => setDate(e.target.value)} /></Champ>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[['Demain', 1], ['Dans 2 jours', 2], ['Dans 1 semaine', 7]].map(([l, n]) => (
            <button key={l} type="button" onClick={() => setDate(decalerJour(aujourdhui(), n))} className="rounded-full border border-craie bg-white px-3 py-1 text-[13px] font-semibold text-pierre transition hover:border-encre hover:text-encre">{l}</button>
          ))}
        </div>
      </Fenetre>
    )
  }
  if (type === 'perdu') {
    return (
      <Fenetre surtitre={titre} titre="Classer comme perdu" onFermer={onFermer}
        actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton variante="encre" onClick={() => faire((x, m) => W.perdre(x, m, texte), 'Dossier classé comme perdu', 'perdu')}>Classer perdu</Bouton></>}>
        <span className="etiquette">Pourquoi ?</span>
        <TexteLibre valeur={texte} onChange={setTexte} placeholder="Pas de budget, déjà équipé, ne répond plus…" />
        <p className="mt-3 font-serif text-[15px] italic text-pierre">Il reste consultable dans le tableau et peut être réactivé.</p>
      </Fenetre>
    )
  }
  if (type === 'renvoyer') {
    return (
      <Fenetre surtitre="Revue technique" titre="Renvoyer l’audit à Hugo" onFermer={onFermer}
        actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton variante="encre" icone="reponse" disabled={!texte.trim()} onClick={() => faire((x, m) => W.renvoyerAudit(x, m, texte), 'Audit renvoyé à Hugo', 'renvoyer')}>Renvoyer</Bouton></>}>
        <span className="etiquette">Ce qui manque ou ce qu’il faut revoir</span>
        <TexteLibre valeur={texte} onChange={setTexte} placeholder="Ex. il me faut le nombre de leads par setter et l’accès à leur Stripe." />
        <p className="mt-3 font-serif text-[15px] italic text-pierre">Hugo voit ton message en haut de l’audit. Tes verdicts sont gardés.</p>
      </Fenetre>
    )
  }
  if (type === 'modif') {
    return (
      <Fenetre surtitre={d.devis?.numero} titre={d.etape === 'envoye' ? 'Le client veut une modification' : 'Demander une modification'} onFermer={onFermer}
        actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton variante="encre" icone="reponse" disabled={!texte.trim()} onClick={() => faire((x, m) => W.demanderModif(x, m, texte), 'Devis renvoyé à Martin', 'modif')}>Renvoyer à Martin</Bouton></>}>
        <span className="etiquette">Ce qu’il faut changer</span>
        <TexteLibre valeur={texte} onChange={setTexte} placeholder="Ex. ajouter la maintenance, passer l’acompte à 50 %…" />
        <p className="mt-3 font-serif text-[15px] italic text-pierre">Les validations repartent à zéro : le devis repassera par vous trois.</p>
      </Fenetre>
    )
  }
  if (type === 'signer') {
    const t = W.totalDevis(d.devis)
    return (
      <Fenetre surtitre={titre} titre="Le contrat est signé ?" onFermer={onFermer}
        actions={<><Bouton variante="discret" onClick={onFermer}>Pas encore</Bouton><Bouton variante="vert" icone="stylo" onClick={() => faire(W.signer, 'Contrat signé : la delivery démarre', 'signer', `dossier/${d.id}/delivery`)}>Oui, lancer la delivery</Bouton></>}>
        <p className="text-[15px]"><b>{euros(t.total)}</b> HT, dont un acompte de <b>{euros(t.acompte)}</b>{t.mensuel ? <> et <b>{euros(t.mensuel)}/mois</b> de maintenance</> : null}.</p>
        <p className="mt-3 font-serif text-[15px] italic text-pierre">Le projet passe chez Martin : les {d.devis.lignes.length} lignes du devis deviennent les livrables.</p>
      </Fenetre>
    )
  }
  return null
}
