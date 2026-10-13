// Fenêtre « Nouveau prospect » (accessible partout : bouton du haut, tableau, ⌘K).
import { useState } from 'react'
import { motion } from 'motion/react'
import { CANAUX, NICHES } from '../config.js'
import { useStore } from '../store.jsx'
import { Bouton, Champ, Fenetre, Puces, TexteLibre } from '../ui.jsx'

export default function NouveauProspect({ onFermer, aller }) {
  const { creerDossier, notifier } = useStore()
  const [f, setF] = useState({ nom: '', business: '', niche: '', canal: 'Instagram', tailleCA: '', instagram: '', email: '', telephone: '', notes: '' })
  const maj = (k) => (v) => setF((x) => ({ ...x, [k]: typeof v === 'object' && v?.target ? v.target.value : v }))
  const valider = (ouvrir) => {
    if (!f.nom.trim()) return
    const id = creerDossier({
      nom: f.nom.trim(), business: f.business.trim(), niche: f.niche, canal: f.canal, tailleCA: f.tailleCA,
      contact: { email: f.email.trim(), telephone: f.telephone.trim(), instagram: f.instagram.trim() },
      prospection: { statut: 'a_contacter', relance: '', callLe: '', notes: f.notes.trim() },
    })
    notifier(`${f.nom.trim()} ajouté à la prospection`)
    ouvrir ? aller(`dossier/${id}`) : onFermer()
  }
  return (
    <Fenetre surtitre="Prospection" titre="Nouveau prospect" onFermer={onFermer} large
      actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton variante="secondaire" disabled={!f.nom.trim()} onClick={() => valider(true)}>Créer et ouvrir</Bouton><Bouton disabled={!f.nom.trim()} onClick={() => valider(false)}>Créer</Bouton></>}>
      <form onSubmit={(e) => { e.preventDefault(); valider(false) }} className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Champ label="Nom de l’infopreneur"><input autoFocus className="champ" value={f.nom} onChange={maj('nom')} placeholder="Prénom Nom" /></Champ>
        <Champ label="Business / marque"><input className="champ" value={f.business} onChange={maj('business')} placeholder="Ex. Girard Trading Academy" /></Champ>
        <Champ label="Niche">
          <select className="champ" value={f.niche} onChange={maj('niche')}>
            <option value="">—</option>
            {NICHES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </Champ>
        <Champ label="CA estimé (k€ / mois)"><input className="champ" inputMode="numeric" value={f.tailleCA} onChange={maj('tailleCA')} placeholder="Ex. 80" /></Champ>
        <div className="md:col-span-2">
          <span className="etiquette">Canal</span>
          <Puces options={CANAUX} valeur={f.canal} onChange={maj('canal')} multiple={false} />
        </div>
        <Champ label="Instagram"><input className="champ" value={f.instagram} onChange={maj('instagram')} placeholder="@compte" /></Champ>
        <Champ label="E-mail"><input type="email" className="champ" value={f.email} onChange={maj('email')} /></Champ>
        <Champ label="Téléphone"><input className="champ" value={f.telephone} onChange={maj('telephone')} /></Champ>
        <div className="md:col-span-2">
          <span className="etiquette">Notes</span>
          <TexteLibre valeur={f.notes} onChange={maj('notes')} placeholder="Comment tu l’as trouvé, ce qu’il vend, taille de l’équipe…" />
        </div>
        <button type="submit" className="hidden" />
      </form>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-5 font-serif text-[15px] italic text-pierre">Il démarre en « À contacter » et apparaît dans les tâches de Nino.</motion.p>
    </Fenetre>
  )
}
