// Onglet Delivery : livrables, échéance, paiements du client, notes de projet.
import { motion } from 'motion/react'
import { STATUTS_LIVRABLE } from '../config.js'
import { aujourdhui, dateCourte, ecartJours, euros, uid } from '../lib.js'
import { useStore } from '../store.jsx'
import { Bouton, Champ, Compteur, EASE, Icone, Presence, Progression, RESSORT, Surtitre, TexteLibre } from '../ui.jsx'
import * as W from '../workflow.js'

export default function OngletDelivery({ d }) {
  const { modifier } = useStore()
  const v = d.delivery
  if (!v) return null
  const fini = d.etape === 'livre'
  const a = W.avancement(d)
  const reste = ecartJours(aujourdhui(), v.livraisonPrevue)
  const majV = (fn) => modifier(d.id, (x) => ({ ...x, delivery: fn(x.delivery) }))
  const majLivrable = (id, patch) => majV((x) => ({ ...x, livrables: x.livrables.map((l) => (l.id === id ? { ...l, ...patch } : l)) }))
  const majPaiement = (id, patch) => majV((x) => ({ ...x, paiements: x.paiements.map((p) => (p.id === id ? { ...p, ...patch } : p)) }))
  const recu = v.paiements.filter((p) => p.recuLe).reduce((s, p) => s + (Number(p.montant) || 0), 0)
  const attendu = v.paiements.reduce((s, p) => s + (Number(p.montant) || 0), 0)

  return (
    <div className="space-y-4">
      {/* Où en est le projet */}
      <section className="carte grid grid-cols-1 gap-6 p-5 md:grid-cols-[1fr_auto] md:p-6">
        <div>
          <Surtitre>Avancement</Surtitre>
          <div className="mt-2 flex items-end gap-4">
            <span className="text-[56px] font-extrabold leading-none tracking-[-0.04em] tabular"><Compteur valeur={a.total ? (a.faits / a.total) * 100 : 0} format={(x) => `${Math.round(x)}%`} /></span>
            <span className="pb-2 text-sm text-pierre">{a.faits} livrable{a.faits > 1 ? 's' : ''} sur {a.total}</span>
          </div>
          <div className="mt-4"><Progression faits={a.faits} total={a.total} epais sansTexte couleur={fini ? 'bg-vert' : 'bg-accent'} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3 md:w-72">
          <Champ label="Début"><input type="date" disabled={fini} className="champ h-10 text-sm" value={v.debut} onChange={(e) => majV((x) => ({ ...x, debut: e.target.value }))} /></Champ>
          <Champ label="Livraison prévue"><input type="date" disabled={fini} className="champ h-10 text-sm" value={v.livraisonPrevue} onChange={(e) => majV((x) => ({ ...x, livraisonPrevue: e.target.value }))} /></Champ>
          <div className={`col-span-2 rounded-xl px-3 py-2 text-center text-sm font-bold ${fini ? 'bg-vert/10 text-vert' : reste < 0 ? 'bg-red-600/10 text-red-700' : reste <= 7 ? 'bg-accent/10 text-accent' : 'bg-papier text-encre'}`}>
            {fini ? `Livré le ${dateCourte(v.livreLe)}` : reste < 0 ? `${-reste} jours de retard` : reste === 0 ? 'Livraison aujourd’hui' : `Livraison dans ${reste} jours`}
          </div>
        </div>
      </section>

      {/* Livrables */}
      <section className="carte p-5 md:p-6">
        <div className="mb-4 flex items-center justify-between">
          <Surtitre>Livrables</Surtitre>
          {!fini && <Bouton taille="sm" variante="secondaire" icone="plus" onClick={() => majV((x) => ({ ...x, livrables: [...x.livrables, { id: uid('v'), titre: '', description: '', statut: 'a_faire' }] }))}>Livrable</Bouton>}
        </div>
        <div className="space-y-2">
          <Presence initial={false}>
            {v.livrables.map((l, i) => {
              const r = STATUTS_LIVRABLE.findIndex((s) => s.id === l.statut)
              return (
                <motion.div key={l.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.35, ease: EASE, delay: i * 0.03 }}
                  className={`rounded-2xl border p-3 transition-colors md:p-4 ${l.statut === 'livre' ? 'border-vert/25 bg-vert/[0.05]' : 'border-craie bg-white'}`}>
                  <div className="flex flex-wrap items-center gap-3">
                    <motion.button type="button" whileTap={{ scale: 0.85 }} disabled={fini}
                      onClick={() => majLivrable(l.id, { statut: l.statut === 'livre' ? 'en_cours' : 'livre' })}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${l.statut === 'livre' ? 'bg-vert text-white' : 'border-2 border-craie hover:border-encre'}`} aria-label="Marquer livré">
                      <Presence initial={false}>{l.statut === 'livre' && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}><Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} /></motion.span>}</Presence>
                    </motion.button>
                    <input disabled={fini} className={`min-w-0 flex-1 bg-transparent text-[15px] font-bold focus:outline-none ${l.statut === 'livre' ? 'text-pierre line-through decoration-craie' : ''}`} value={l.titre} placeholder="Nom du livrable" onChange={(e) => majLivrable(l.id, { titre: e.target.value })} />
                    <div className="flex w-full gap-0.5 rounded-full bg-papier p-0.5 sm:w-auto">
                      {STATUTS_LIVRABLE.map((s, j) => (
                        <button key={s.id} type="button" disabled={fini} onClick={() => majLivrable(l.id, { statut: s.id })}
                          className={`relative flex-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11.5px] font-bold transition-colors sm:flex-none ${l.statut === s.id ? 'text-white' : j < r ? 'text-encre/70' : 'text-pierre hover:text-encre'}`}>
                          {l.statut === s.id && <motion.span layoutId={`liv-${l.id}`} transition={RESSORT} className={`absolute inset-0 rounded-full ${s.id === 'livre' ? 'bg-vert' : s.id === 'a_faire' ? 'bg-pierre' : 'bg-accent'}`} />}
                          <span className="relative">{s.label}</span>
                        </button>
                      ))}
                    </div>
                    {!fini && <button type="button" onClick={() => majV((x) => ({ ...x, livrables: x.livrables.filter((y) => y.id !== l.id) }))} className="hidden h-8 w-8 items-center justify-center rounded-full text-pierre transition hover:bg-red-600/10 hover:text-red-700 sm:flex" aria-label="Retirer"><Icone nom="corbeille" /></button>}
                  </div>
                  {l.description && <p className="ml-10 mt-1 text-sm text-pierre">{l.description}</p>}
                </motion.div>
              )
            })}
          </Presence>
        </div>
      </section>

      {/* Paiements */}
      <section className="carte p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Surtitre>Paiements du client</Surtitre>
          <span className="text-sm"><b className="tabular">{euros(recu)}</b> <span className="text-pierre">encaissés sur {euros(attendu)}</span></span>
        </div>
        <div className="space-y-2">
          {v.paiements.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-craie bg-white px-4 py-3">
              <input className="min-w-0 flex-1 bg-transparent text-sm font-semibold focus:outline-none" value={p.libelle} onChange={(e) => majPaiement(p.id, { libelle: e.target.value })} />
              <span className="text-[15px] font-extrabold tabular">{euros(p.montant)}</span>
              <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => majPaiement(p.id, { recuLe: p.recuLe ? null : aujourdhui() })}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-bold transition-colors ${p.recuLe ? 'bg-vert text-white' : 'border border-craie text-pierre hover:border-encre hover:text-encre'}`}>
                <Icone nom={p.recuLe ? 'coche' : 'horloge'} className="h-3.5 w-3.5" epaisseur={2.4} />
                {p.recuLe ? `Reçu le ${dateCourte(p.recuLe)}` : 'En attente'}
              </motion.button>
            </div>
          ))}
        </div>
        {d.devis.maintenance > 0 && <p className="mt-3 text-sm text-pierre">Puis <b className="text-accent">{euros(d.devis.maintenance)} / mois</b> de maintenance après la livraison.</p>}
      </section>

      <section className="carte p-5 md:p-6">
        <span className="etiquette">Notes de projet</span>
        <TexteLibre valeur={v.notes} onChange={(t) => majV((x) => ({ ...x, notes: t }))} placeholder="Accès, liens (repo, Supabase, Vercel), décisions prises avec le client…" />
      </section>

    </div>
  )
}
