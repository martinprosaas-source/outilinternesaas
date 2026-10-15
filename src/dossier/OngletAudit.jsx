// Onglet Audit : Hugo suit la trame (9 blocs, chaque case cochée ou notée en question ouverte) et liste les besoins.
// Le livrable en 5 parties se construit tout seul ; c'est lui que Martin lit en revue technique.
import { useState } from 'react'
import { motion } from 'motion/react'
import { TARIFS } from '../config.js'
import { depuis, euros, uid } from '../lib.js'
import { useStore } from '../store.jsx'
import { AvatarMembre, Champ, EASE, Icone, Onglets, Presence, Progression, Puces, RESSORT, Surtitre, TexteLibre } from '../ui.jsx'
import { nomMembre } from './commun.jsx'
import { BoutonsAction } from './Actions.jsx'
import LivrableAudit from './LivrableAudit.jsx'
import { API, APPAREILS, BLOCS, ENTRETIENS, LANGUES, PRIORITES, REGLES_OR, SOURCES, SUJETS_DECISION, cleItem } from '../trame.js'
import * as W from '../workflow.js'

// ─────────────────────────── Champs ───────────────────────────

const libelle = (o) => (typeof o === 'string' ? o : o.label)
const valeurDe = (o) => (typeof o === 'string' ? o : o.id)

function Cellule({ c, valeur, edition, onChange }) {
  const titre = <span className="mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] text-pierre md:hidden">{c.label}</span>
  if (!edition) {
    const o = c.options?.find((x) => valeurDe(x) === valeur)
    return <div className="min-w-0">{titre}<div className="rounded-xl bg-papier/70 px-3 py-2 text-[14px] leading-snug">{(o ? libelle(o) : valeur) || <span className="text-pierre/50">—</span>}</div></div>
  }
  return (
    <div className="min-w-0">
      {titre}
      {c.options
        ? <select className="champ h-10 text-sm" value={valeur || ''} onChange={(e) => onChange(e.target.value)}><option value="">—</option>{c.options.map((o) => <option key={valeurDe(o)} value={valeurDe(o)}>{libelle(o)}</option>)}</select>
        : <input className="champ h-10 text-sm" value={valeur || ''} placeholder={c.ph || c.label} onChange={(e) => onChange(e.target.value)} />}
    </div>
  )
}

// Une liste de lignes à saisir (offres, équipe, règles, besoins…) : en-têtes sur ordinateur, fiches empilées sur téléphone.
function Lignes({ lignes, colonnes, gabarit, onChange, edition, ajouter, vide = 'Rien de noté.' }) {
  const g = edition ? `${gabarit} 36px` : gabarit
  const maj = (id, k, v) => onChange(lignes.map((l) => (l.id === id ? { ...l, [k]: v } : l)))
  const nouvelle = () => onChange([...lignes, { id: uid('x'), ...Object.fromEntries(colonnes.map((c) => [c.k, c.defaut ?? ''])) }])
  return (
    <div>
      {lignes.length > 0 && (
        <div className="hidden gap-2 px-1 pb-1.5 md:grid" style={{ gridTemplateColumns: g }}>
          {colonnes.map((c) => <span key={c.k} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pierre">{c.label}</span>)}
        </div>
      )}
      <div className="space-y-2">
        <Presence initial={false}>
          {lignes.map((l) => (
            <motion.div key={l.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }}
              className="grid grid-cols-1 gap-2 rounded-2xl border border-craie p-2.5 md:items-center md:rounded-none md:border-0 md:p-0 md:[grid-template-columns:var(--g)]" style={{ '--g': g }}>
              {colonnes.map((c) => <Cellule key={c.k} c={c} valeur={l[c.k]} edition={edition} onChange={(v) => maj(l.id, c.k, v)} />)}
              {edition && (
                <button type="button" onClick={() => onChange(lignes.filter((x) => x.id !== l.id))} className="flex h-9 w-9 items-center justify-center justify-self-end rounded-full text-pierre transition hover:bg-red-600/10 hover:text-red-700" aria-label="Retirer">
                  <Icone nom="corbeille" />
                </button>
              )}
            </motion.div>
          ))}
        </Presence>
      </div>
      {!lignes.length && !edition && <p className="font-serif text-[15px] italic text-pierre">{vide}</p>}
      {edition && (
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={nouvelle} className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-craie px-3.5 text-[13px] font-semibold text-pierre transition hover:border-encre hover:text-encre">
          <Icone nom="plus" className="h-3.5 w-3.5" epaisseur={2.4} /> {ajouter}
        </motion.button>
      )}
    </div>
  )
}

function Saisie({ edition, valeur, onChange, placeholder, type = 'text' }) {
  if (!edition) return <div className="min-h-[40px] rounded-xl bg-papier/70 px-3.5 py-2 text-[15px]">{valeur || <span className="text-pierre/50">—</span>}</div>
  return <input type={type} className="champ h-10 text-sm" value={valeur || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
}
function Texte({ edition, valeur, onChange, placeholder, lignes = 2 }) {
  if (!edition) return <div className="whitespace-pre-line rounded-xl bg-papier/70 px-3.5 py-2.5 text-[15px] leading-relaxed">{valeur || <span className="text-pierre/50">—</span>}</div>
  return <TexteLibre valeur={valeur} onChange={onChange} placeholder={placeholder} lignes={lignes} />
}

// ─────────────────────────── Un bloc de la trame ───────────────────────────

function Item({ it, etat, edition, onCocher, onManque }) {
  return (
    <li className="flex gap-3 py-2.5">
      <motion.button type="button" disabled={!edition} whileTap={{ scale: 0.82 }} onClick={onCocher} aria-label="Couvert"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors ${etat === 'ok' ? 'bg-vert text-white' : etat === 'question' ? 'bg-ambre text-white' : 'border-2 border-craie enabled:hover:border-encre'}`}>
        <Presence initial={false} mode="wait">
          {etat && (
            <motion.span key={etat} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}>
              {etat === 'ok' ? <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} /> : <span className="block text-[12px] font-extrabold leading-none">?</span>}
            </motion.span>
          )}
        </Presence>
      </motion.button>
      <div className="min-w-0 flex-1">
        <p className={`text-[14.5px] leading-snug transition-colors ${etat === 'ok' ? 'text-encre/55' : ''}`}>{it.texte}</p>
        {it.piege && (
          <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5 text-[12.5px] leading-snug text-pierre">
            <span className="rounded-full bg-papier px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.08em] text-encre/70">Vu sur EcomBoss</span>
            <span className="font-serif text-[13.5px] italic">{it.piege}</span>
          </p>
        )}
      </div>
      {edition && etat !== 'ok' && (
        <button type="button" onClick={onManque}
          className={`h-7 shrink-0 self-start whitespace-nowrap rounded-full px-2.5 text-[12px] font-bold transition ${etat === 'question' ? 'bg-ambre/10 text-ambre hover:bg-ambre/15' : 'text-pierre hover:bg-papier hover:text-encre'}`}>
          {etat === 'question' ? 'Question ouverte ×' : 'Sans réponse'}
        </button>
      )}
    </li>
  )
}

function Pieces({ bloc, a, edition, maj }) {
  const liste = a.pieces.filter((p) => p.bloc === bloc.id)
  const majP = (id, patch) => maj((x) => ({ ...x, pieces: x.pieces.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  if (!edition && !liste.length) return null
  return (
    <div>
      <span className="etiquette">Preuves · {bloc.pieces.toLowerCase()}</span>
      <div className="space-y-2">
        {liste.map((p) => edition ? (
          <div key={p.id} className="flex flex-wrap gap-2 sm:flex-nowrap">
            <input className="champ h-10 text-sm sm:w-56" value={p.nom} placeholder="Ce que c’est (capture du Sheet…)" onChange={(e) => majP(p.id, { nom: e.target.value })} />
            <input className="champ h-10 flex-1 text-sm" value={p.lien} placeholder="Lien (Drive, Loom, Notion…)" onChange={(e) => majP(p.id, { lien: e.target.value })} />
            <button type="button" onClick={() => maj((x) => ({ ...x, pieces: x.pieces.filter((y) => y.id !== p.id) }))} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-pierre transition hover:bg-red-600/10 hover:text-red-700" aria-label="Retirer"><Icone nom="corbeille" /></button>
          </div>
        ) : (
          <a key={p.id} href={p.lien || undefined} target="_blank" rel="noreferrer" className="mr-1.5 inline-flex items-center gap-1 rounded-full border border-craie px-2.5 py-1 text-[12.5px] font-semibold hover:border-encre"><Icone nom={p.lien ? 'lien' : 'doc'} className="h-3.5 w-3.5" /> {p.nom || 'Pièce'}</a>
        ))}
      </div>
      {edition && (
        <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={() => maj((x) => ({ ...x, pieces: [...x.pieces, { id: uid('pc'), bloc: bloc.id, nom: '', lien: '' }] }))}
          className="mt-2 inline-flex h-9 items-center gap-1.5 rounded-full border border-dashed border-craie px-3.5 text-[13px] font-semibold text-pierre transition hover:border-encre hover:text-encre">
          <Icone nom="lien" className="h-3.5 w-3.5" /> Ajouter une preuve
        </motion.button>
      )}
    </div>
  )
}

// Les champs propres à chaque bloc : ce qui remplit la fiche client et le livrable.
function ChampsBloc({ id, a, edition, majFiche, majListe }) {
  const f = a.fiche
  switch (id) {
    case 'business': return (
      <>
        <div><span className="etiquette">Les offres</span>
          <Lignes edition={edition} lignes={f.offres} onChange={majFiche('offres')} gabarit="1.4fr 0.6fr 1.4fr" ajouter="Ajouter une offre"
            colonnes={[{ k: 'offre', label: 'Offre', ph: 'Accompagnement 1:1' }, { k: 'prix', label: 'Prix', ph: '3 500 €' }, { k: 'paiement', label: 'Options de paiement', ph: '1x, 3x, 6x' }]} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[['leads', 'Leads / mois', '2 000'], ['rdv', 'Rendez-vous / mois', '320'], ['ventes', 'Ventes / mois', '45'], ['ca', 'CA mensuel', '150 k€']].map(([k, label, ph]) => (
            <Champ key={k} label={label}><Saisie edition={edition} valeur={f.volumes[k]} placeholder={ph} onChange={(v) => majFiche('volumes')({ ...f.volumes, [k]: v })} /></Champ>
          ))}
        </div>
        <div><span className="etiquette">Sources de leads</span>
          {edition ? <Puces options={SOURCES} valeur={f.sources} onChange={majFiche('sources')} /> : <div className="text-[15px]">{f.sources.join(', ') || '—'}</div>}
        </div>
        <div><span className="etiquette">Le tunnel, étape par étape</span><Texte edition={edition} valeur={f.tunnel} onChange={majFiche('tunnel')} placeholder="Pub Meta → page → formulaire Typeform → rendez-vous iClosed → appel → paiement Whop → onboarding Skool → accompagnement" /></div>
      </>
    )
    case 'personnes': return (
      <>
        <div><span className="etiquette">L’équipe</span>
          <Lignes edition={edition} lignes={f.equipe} onChange={majFiche('equipe')} gabarit="1fr 1fr 1fr 0.8fr 0.8fr" ajouter="Ajouter une personne"
            colonnes={[{ k: 'prenom', label: 'Prénom' }, { k: 'role', label: 'Rôle', ph: 'Closer' }, { k: 'pays', label: 'Pays / fuseau', ph: 'Maroc (UTC+1)' }, { k: 'langue', label: 'Langue', options: LANGUES, defaut: 'Français' }, { k: 'appareil', label: 'Appareil', options: APPAREILS }]} />
        </div>
        <div><span className="etiquette">Accès extérieurs (partenaire, apporteur, coach)</span><Texte edition={edition} valeur={f.externes} onChange={majFiche('externes')} placeholder="Qui, et ce qu’il doit voir. « Aucun » si personne." /></div>
        <div><span className="etiquette">Qui tranche, sujet par sujet ?</span>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {SUJETS_DECISION.map((s) => <Champ key={s.id} label={s.label}><Saisie edition={edition} valeur={f.decideurs[s.id]} placeholder="Prénom" onChange={(v) => majFiche('decideurs')({ ...f.decideurs, [s.id]: v })} /></Champ>)}
          </div>
        </div>
      </>
    )
    case 'outils': return (
      <div><span className="etiquette">Les outils et les accès</span>
        <Lignes edition={edition} lignes={a.acces} onChange={majListe('acces')} gabarit="1fr 0.8fr 0.7fr 0.9fr 1fr 0.7fr" ajouter="Ajouter un outil"
          colonnes={[{ k: 'outil', label: 'Outil', ph: 'Whop' }, { k: 'abonnement', label: 'Abonnement', ph: 'Pro' }, { k: 'api', label: 'API', options: API }, { k: 'admin', label: 'Admin' }, { k: 'cles', label: 'Donne les clés' }, { k: 'quand', label: 'Quand', ph: 'Lundi' }]} />
      </div>
    )
    case 'argent': return (
      <div><span className="etiquette">Les règles d’argent, chacune avec un exemple chiffré</span>
        <Lignes edition={edition} lignes={a.regles} onChange={majListe('regles')} gabarit="1fr 1.6fr 0.7fr" ajouter="Ajouter une règle"
          colonnes={[{ k: 'regle', label: 'Règle', ph: '10 % au closer, sur l’encaissé' }, { k: 'exemple', label: 'Exemple chiffré', ph: 'Vente 3 500 €, 1 000 € payés, l’élève part : le closer touche 100 €' }, { k: 'validePar', label: 'Validée par' }]} />
      </div>
    )
    case 'depart': return (
      <div className="max-w-xs"><Champ label="Les chiffres de l’outil partent du"><Saisie edition={edition} type="date" valeur={f.dateDepart} onChange={majFiche('dateDepart')} /></Champ></div>
    )
    case 'perimetre': return (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Champ label="Budget envisagé"><Saisie edition={edition} valeur={f.budget} onChange={majFiche('budget')} placeholder="8 à 10 k€" /></Champ>
          <Champ label="Valide le devis et paie"><Saisie edition={edition} valeur={f.decideurDevis} onChange={majFiche('decideurDevis')} placeholder="Prénom, rôle" /></Champ>
          <Champ label="Lancement souhaité, et pourquoi cette date"><Saisie edition={edition} valeur={f.lancement} onChange={majFiche('lancement')} placeholder="1er décembre, ouverture d’une nouvelle promo" /></Champ>
          <Champ label="Valide la recette côté client"><Saisie edition={edition} valeur={f.valideurRecette} onChange={majFiche('valideurRecette')} placeholder="Prénom, rôle" /></Champ>
        </div>
        <div><span className="etiquette">Les critères de recette</span>
          <Lignes edition={edition} lignes={a.recette} onChange={majListe('recette')} gabarit="1fr" ajouter="Ajouter un critère"
            colonnes={[{ k: 'texte', label: 'Critère', ph: 'Chaque paiement Whop apparaît sur sa vente en moins d’une minute' }]} />
        </div>
        <div><span className="etiquette">Explicitement exclu</span><Texte edition={edition} valeur={f.exclus} onChange={majFiche('exclus')} placeholder="Noir sur blanc : ce que l’outil ne fera pas." /></div>
      </>
    )
    default: return null
  }
}

function Bloc({ b, n, a, c, edition, ouvert, onBasculer, maj, majFiche, majListe }) {
  const cocher = (cle) => maj((x) => ({ ...x, coches: { ...x.coches, [cle]: !x.coches[cle] } }))
  const manque = (cle, texte) => maj((x) => (x.questions.some((q) => q.item === cle)
    ? { ...x, questions: x.questions.filter((q) => q.item !== cle) }
    : { ...x, coches: { ...x.coches, [cle]: false }, questions: [...x.questions, { id: uid('q'), item: cle, texte, aQui: '', reponse: '' }] }))
  return (
    <section id={`audit-${b.id}`} className={`carte scroll-mt-28 overflow-hidden transition-colors ${c.termine ? 'border-vert/25' : ''}`}>
      <button type="button" onClick={onBasculer} className="flex w-full items-center gap-3 p-5 text-left md:px-6">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${c.termine ? 'bg-vert text-white' : 'bg-papier text-pierre'}`}>
          {c.termine ? <Icone nom="coche" className="h-4 w-4" epaisseur={3} /> : n}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[17px] font-extrabold tracking-tight">{b.titre}</h3>
          <div className="mt-1 flex items-center gap-2"><div className="w-24"><Progression faits={c.faits} total={c.total} sansTexte couleur={c.termine ? 'bg-vert' : 'bg-accent'} /></div><span className="text-[12px] font-semibold text-pierre tabular">{c.faits}/{c.total}</span>{c.questions > 0 && <span className="text-[12px] font-bold text-ambre">· {c.questions} question{c.questions > 1 ? 's' : ''}</span>}</div>
        </div>
        <Icone nom="bas" className={`h-5 w-5 shrink-0 text-pierre transition-transform duration-300 ${ouvert ? 'rotate-180' : ''}`} />
      </button>
      <Presence initial={false}>
        {ouvert && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
            <div className="space-y-5 border-t border-craie px-5 pb-6 pt-2 md:px-6">
              <ul className="divide-y divide-craie/70">
                {b.items.map((it) => {
                  const cle = cleItem(b.id, it.id)
                  return <Item key={it.id} it={it} etat={W.etatItem(a, cle)} edition={edition} onCocher={() => cocher(cle)} onManque={() => manque(cle, it.texte)} />
                })}
              </ul>
              <ChampsBloc id={b.id} a={a} edition={edition} majFiche={majFiche} majListe={majListe} />
              <div><span className="etiquette">Ce qu’ils ont dit</span><Texte edition={edition} valeur={a.notes[b.id]} onChange={(v) => maj((x) => ({ ...x, notes: { ...x.notes, [b.id]: v } }))} placeholder="Des faits, des chiffres, leurs mots. Pas de solution." /></div>
              <Pieces bloc={b} a={a} edition={edition} maj={maj} />
            </div>
          </motion.div>
        )}
      </Presence>
    </section>
  )
}

// ─────────────────────────── L'onglet ───────────────────────────

export default function OngletAudit({ d, moi, aller }) {
  const { modifier } = useStore()
  const edition = d.etape === 'audit' && !d.perdu
  const revue = d.etape === 'revue' && moi.role === 'dev' && !d.perdu
  const [vue, setVue] = useState(edition ? 'collecte' : 'livrable')
  const [regles, setRegles] = useState(false)
  const a = W.normaliserAudit(d.audit)
  const c = W.completionAudit(a)
  const [ouverts, setOuverts] = useState(() => new Set(BLOCS.filter((b) => !c.blocs[b.id].termine).slice(0, 1).map((b) => b.id)))
  if (!d.audit) return null

  const maj = (fn) => modifier(d.id, (x) => ({ ...x, audit: fn(W.normaliserAudit(x.audit)) }))
  const majFiche = (k) => (v) => maj((x) => ({ ...x, fiche: { ...x.fiche, [k]: v } }))
  const majListe = (k) => (v) => maj((x) => ({ ...x, [k]: v }))
  const onVerdict = (id, patch) => maj((x) => ({ ...x, besoins: x.besoins.map((b) => (b.id === id ? { ...b, revue: { ...b.revue, ...patch } } : b)) }))
  const basculer = (id) => setOuverts((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
  const allerA = (id) => {
    setVue('collecte')
    setOuverts((s) => new Set(s).add(id))
    setTimeout(() => document.getElementById(`audit-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  const dernierRetour = a.retours[0]
  const retourOuvert = edition && dernierRetour && (!a.soumisLe || dernierRetour.date > a.soumisLe)
  const ouvertes = W.questionsOuvertes(a)
  const ind = a.besoins.filter((b) => b.priorite === 'indispensable')
  const juges = ind.filter((b) => b.revue?.verdict).length
  const retenus = ind.filter((b) => b.revue?.verdict && b.revue.verdict !== 'non')
  const jours = retenus.reduce((s, b) => s + (Number(b.revue.jours) || 0), 0)
  const global = W.verdictGlobal(a)

  return (
    <div className="space-y-4">
      {retourOuvert && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
          <AvatarMembre id={dernierRetour.qui} nom={nomMembre(dernierRetour.qui)} />
          <div className="text-sm">
            <div><b>{nomMembre(dernierRetour.qui)} a renvoyé l’audit</b> <span className="text-pierre">· {depuis(dernierRetour.date)}</span></div>
            <p className="mt-1 font-serif text-[16px] italic">« {dernierRetour.texte} »</p>
          </div>
        </motion.div>
      )}

      {/* Où en est l'audit */}
      <div className="carte p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Onglets valeur={vue} onChange={setVue} options={[{ id: 'collecte', label: 'Les 9 blocs' }, { id: 'livrable', label: 'Le livrable' }]} />
          {edition
            ? <Champ label="Call d’audit" className="w-full sm:w-44"><input type="date" className="champ h-9 text-sm" value={a.callLe || ''} onChange={(e) => maj((x) => ({ ...x, callLe: e.target.value }))} /></Champ>
            : <span className="text-[13px] text-pierre">{ouvertes.length ? <b className="text-ambre">{ouvertes.length} question{ouvertes.length > 1 ? 's' : ''} sans réponse</b> : 'Aucune question en suspens'}</span>}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="w-28 shrink-0"><Progression faits={c.faits} total={c.total} couleur={c.faits === c.total ? 'bg-vert' : 'bg-accent'} /></div>
          <div className="sans-barre -mr-4 flex flex-1 gap-1.5 overflow-x-auto pr-4 md:mr-0 md:flex-wrap md:pr-0">
            {BLOCS.map((b, i) => {
              const x = c.blocs[b.id]
              return (
                <button key={b.id} type="button" onClick={() => allerA(b.id)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${x.termine ? 'bg-vert/10 text-vert' : 'bg-papier text-pierre hover:text-encre'}`}>
                  {x.termine ? <Icone nom="coche" className="h-3 w-3" epaisseur={3} /> : <span className="tabular">{i + 1}</span>}{b.court}
                  {x.questions > 0 && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-ambre" />}
                </button>
              )
            })}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-craie pt-4">
          <span className="mr-1 text-[12px] font-semibold text-pierre">Entretiens</span>
          {ENTRETIENS.map((e) => {
            const fait = !!a.entretiens[e.id]
            return (
              <motion.button key={e.id} type="button" disabled={!edition} whileTap={{ scale: 0.94 }} onClick={() => maj((x) => ({ ...x, entretiens: { ...x.entretiens, [e.id]: !x.entretiens[e.id] } }))}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition-colors ${fait ? 'border-encre bg-encre text-papier' : 'border-craie bg-white text-pierre enabled:hover:border-pierre/40 enabled:hover:text-encre'}`}>
                {fait && <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={2.6} />}{e.label}{e.duree && <span className={fait ? 'text-papier/60' : 'text-pierre/70'}>· {e.duree}</span>}
              </motion.button>
            )
          })}
        </div>
      </div>

      <Presence mode="wait" initial={false}>
        {vue === 'livrable' ? (
          <motion.div key="livrable" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
            <LivrableAudit a={a} revue={revue} onVerdict={onVerdict} />
          </motion.div>
        ) : (
          <motion.div key="collecte" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }} className="space-y-4">
            {/* Les règles d'or */}
            <div className="carte overflow-hidden">
              <button type="button" onClick={() => setRegles(!regles)} className="flex w-full items-center gap-3 px-5 py-4 text-left md:px-6">
                <Icone nom="etoile" className="h-4 w-4 text-accent" />
                <span className="flex-1 text-[14px]"><b>Les 6 règles d’or</b> <span className="hidden font-serif text-[15px] italic text-pierre sm:inline">· des faits, une preuve, un exemple chiffré, les cas particuliers d’abord</span></span>
                <Icone nom="bas" className={`h-4 w-4 text-pierre transition-transform duration-300 ${regles ? 'rotate-180' : ''}`} />
              </button>
              <Presence initial={false}>
                {regles && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} className="overflow-hidden">
                    <div className="grid grid-cols-1 gap-2.5 border-t border-craie p-5 sm:grid-cols-2 md:px-6 lg:grid-cols-3">
                      {REGLES_OR.map((r, i) => (
                        <div key={r.titre} className="rounded-2xl bg-papier/70 p-4">
                          <div className="text-[14px] font-extrabold"><span className="font-serif font-normal italic text-pierre">{i + 1}.</span> {r.titre}</div>
                          <p className="mt-1 text-[13px] leading-snug text-pierre">{r.texte}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </Presence>
            </div>

            {BLOCS.map((b, i) => (
              <Bloc key={b.id} b={b} n={i + 1} a={a} c={c.blocs[b.id]} edition={edition} ouvert={ouverts.has(b.id)} onBasculer={() => basculer(b.id)} maj={maj} majFiche={majFiche} majListe={majListe} />
            ))}

            {/* La liste des besoins */}
            <section id="audit-besoins" className="carte scroll-mt-28 p-5 md:p-6">
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-[17px] font-extrabold tracking-tight">La liste des besoins</h3>
                <span className="text-[13px] text-pierre">{a.besoins.length} besoin{a.besoins.length > 1 ? 's' : ''} · {ind.length} indispensable{ind.length > 1 ? 's' : ''}</span>
              </div>
              <p className="mb-4 font-serif text-[15px] italic text-pierre">Un besoin par ligne : qui, a besoin de quoi, pour quoi. Des faits, pas des écrans.</p>
              <Lignes edition={edition} lignes={a.besoins} onChange={majListe('besoins')} gabarit="0.8fr 1.5fr 1.3fr 0.9fr 1fr" ajouter="Ajouter un besoin" vide="Aucun besoin."
                colonnes={[
                  { k: 'qui', label: 'Qui', ph: 'La compta' },
                  { k: 'besoin', label: 'A besoin de…', ph: 'voir chaque paiement Whop rattaché à sa vente' },
                  { k: 'pour', label: 'Pour…', ph: 'ne plus pointer à la main en fin de mois' },
                  { k: 'priorite', label: 'Priorité', options: PRIORITES, defaut: 'indispensable' },
                  { k: 'preuve', label: 'Preuve', ph: 'Capture du tableur de pointage' },
                ]} />
            </section>

            {/* Questions ouvertes */}
            <section id="audit-questions" className="carte scroll-mt-28 p-5 md:p-6">
              <div className="mb-1 flex flex-wrap items-baseline gap-x-3">
                <h3 className="text-[17px] font-extrabold tracking-tight">Les questions ouvertes</h3>
                <span className={`text-[13px] ${ouvertes.length ? 'font-bold text-ambre' : 'text-pierre'}`}>{ouvertes.length} sans réponse</span>
              </div>
              <p className="mb-4 font-serif text-[15px] italic text-pierre">Ce qui n’a pas eu de réponse, et à qui le demander. Jamais une supposition.</p>
              <Lignes edition={edition} lignes={a.questions} onChange={majListe('questions')} gabarit="1.6fr 0.7fr 1.2fr" ajouter="Ajouter une question" vide="Aucune question."
                colonnes={[{ k: 'texte', label: 'Question' }, { k: 'aQui', label: 'À qui', ph: 'Prénom' }, { k: 'reponse', label: 'Réponse', ph: 'Quand on l’a' }]} />
            </section>
          </motion.div>
        )}
      </Presence>

      {/* Actions de l'étape */}
      {edition && (
        <div className="sticky bottom-24 z-20 md:bottom-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-encre px-5 py-4 text-papier shadow-[0_24px_60px_-20px_rgba(18,18,18,0.7)]">
            <div className="text-sm">
              <b>{c.faits === c.total ? 'Les 9 blocs sont couverts.' : `${c.total - c.faits} bloc${c.total - c.faits > 1 ? 's' : ''} à terminer.`}</b>
              <span className="text-papier/60"> {a.besoins.length} besoin{a.besoins.length > 1 ? 's' : ''} · {ouvertes.length} question{ouvertes.length > 1 ? 's' : ''} ouverte{ouvertes.length > 1 ? 's' : ''}</span>
            </div>
            {moi.role === 'audit'
              ? <BoutonsAction d={d} ids={['envoyer_revue']} taille="md" sombre aller={aller} suivre />
              : <span className="text-xs text-papier/60">C’est Hugo qui l’envoie en revue.</span>}
          </motion.div>
        </div>
      )}
      {revue && (
        <div className="sticky bottom-24 z-20 md:bottom-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-encre px-5 py-4 text-papier shadow-[0_24px_60px_-20px_rgba(18,18,18,0.7)]">
            <div className="text-sm">
              <b>{global ? W.VERDICTS.find((x) => x.id === global).label : `${juges}/${ind.length} verdicts`}</b>
              <span className="text-papier/60"> · {retenus.length} besoin{retenus.length > 1 ? 's' : ''} retenu{retenus.length > 1 ? 's' : ''}, {jours} j ≈ {euros(jours * TARIFS.tjm)}</span>
            </div>
            <BoutonsAction d={d} ids={['valider_audit', 'renvoyer']} taille="md" sombre aller={aller} suivre />
          </motion.div>
        </div>
      )}
      {!edition && !revue && <Surtitre className="pt-2 text-center">Audit {d.etape === 'revue' ? 'en revue chez Martin, en lecture seule' : 'validé, en lecture seule'}</Surtitre>}
    </div>
  )
}
