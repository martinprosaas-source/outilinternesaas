// Onglet Prospection : statut, call, relance, notes de Nino, coordonnées. Puis le passage à Hugo.
import { motion } from 'motion/react'
import { CANAUX, NICHES, STATUTS_PROSPECT } from '../config.js'
import { useStore } from '../store.jsx'
import { Champ, Icone, Puces, RESSORT, Surtitre, TexteLibre } from '../ui.jsx'
import * as W from '../workflow.js'

export default function OngletProspection({ d, moi }) {
  const { modifier, agir } = useStore()
  const actif = d.etape === 'prospect' && !d.perdu
  const p = d.prospection
  const majP = (k) => (v) => modifier(d.id, (x) => ({ ...x, prospection: { ...x.prospection, [k]: v?.target ? v.target.value : v } }))
  const maj = (k) => (v) => modifier(d.id, (x) => ({ ...x, [k]: v?.target ? v.target.value : v }))
  const majC = (k) => (e) => modifier(d.id, (x) => ({ ...x, contact: { ...x.contact, [k]: e.target.value } }))
  const rang = STATUTS_PROSPECT.findIndex((s) => s.id === p.statut)

  return (
    <div className="space-y-5">
      {/* Statut : quatre marches, la pastille glisse de l'une à l'autre */}
      <section className="carte p-5 md:p-6">
        <Surtitre className="mb-4">Statut du contact</Surtitre>
        <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-papier p-1.5 md:grid-cols-4">
          {STATUTS_PROSPECT.map((s, i) => {
            const ici = s.id === p.statut
            return (
              <button key={s.id} disabled={!actif} onClick={() => agir(d.id, (x) => W.changerStatutProspect(x, s.id, moi.id))}
                className={`relative flex h-12 items-center justify-center gap-2 rounded-xl text-[13px] font-bold transition-colors disabled:cursor-default ${ici ? 'text-papier' : i < rang ? 'text-encre' : 'text-pierre hover:text-encre'}`}>
                {ici && <motion.span layoutId={`statut-${d.id}`} transition={RESSORT} className="absolute inset-0 rounded-xl bg-encre" />}
                <span className="relative flex items-center gap-1.5">
                  {i < rang && <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={2.6} />}
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Champ label="Call prévu le"><input type="date" disabled={!actif} className="champ" value={p.callLe || ''} onChange={majP('callLe')} /></Champ>
          <Champ label="Prochaine relance"><input type="date" disabled={!actif} className="champ" value={p.relance || ''} onChange={majP('relance')} /></Champ>
        </div>
        <div className="mt-4">
          <span className="etiquette">Notes de Nino</span>
          <TexteLibre valeur={p.notes} onChange={majP('notes')} placeholder="Ce qui s’est dit en DM ou au call, objections, taille de l’équipe…" />
        </div>
      </section>

      {/* Fiche */}
      <section className="carte p-5 md:p-6">
        <Surtitre className="mb-4">Fiche</Surtitre>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Champ label="Nom"><input className="champ" value={d.nom} onChange={maj('nom')} /></Champ>
          <Champ label="Business / marque"><input className="champ" value={d.business} onChange={maj('business')} /></Champ>
          <Champ label="Niche">
            <select className="champ" value={d.niche} onChange={maj('niche')}>
              <option value="">—</option>
              {NICHES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </Champ>
          <Champ label="CA estimé (k€ / mois)"><input className="champ" inputMode="numeric" value={d.tailleCA} onChange={maj('tailleCA')} /></Champ>
          <Champ label="Instagram"><input className="champ" value={d.contact?.instagram || ''} onChange={majC('instagram')} /></Champ>
          <Champ label="E-mail"><input className="champ" value={d.contact?.email || ''} onChange={majC('email')} /></Champ>
          <Champ label="Téléphone"><input className="champ" value={d.contact?.telephone || ''} onChange={majC('telephone')} /></Champ>
        </div>
        <div className="mt-4">
          <span className="etiquette">Canal</span>
          <Puces options={CANAUX} valeur={d.canal} onChange={maj('canal')} multiple={false} />
        </div>
      </section>
    </div>
  )
}
