// Le tableau : tous les dossiers en 4 colonnes (les 4 phases). Sur chaque carte : qui a la balle et depuis quand.
import { useMemo, useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { MEMBRES, PHASES, membre } from '../config.js'
import { aujourdhui, euros, eurosCourts, jourLocal } from '../lib.js'
import { useStore } from '../store.jsx'
import { AvatarMembre, EASE, EnTete, Icone, Onglets, Presence, RESSORT } from '../ui.jsx'
import { Balle, PastilleSuivi } from '../dossier/commun.jsx'
import * as S from '../suivi.js'
import * as W from '../workflow.js'

const POIDS = { rouge: 0, orange: 1, ok: 2 }

function Carte({ d, moiId, aller, i }) {
  const aMoi = W.aMoiDeJouer(d, moiId)
  const total = W.totalDevis(d.devis).total
  const a = d.etape === 'delivery' || d.etape === 'livre' ? W.avancement(d) : null
  const fini = d.etape === 'livre' || d.perdu
  return (
    <motion.button
      type="button"
      layout layoutId={`carte-${d.id}`}
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: EASE, delay: Math.min(i, 8) * 0.04, layout: RESSORT }}
      onClick={() => aller(`dossier/${d.id}`)}
      className={`group relative w-full overflow-hidden rounded-[18px] border bg-white p-3.5 text-left transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-22px_rgba(18,18,18,0.35)] ${
        aMoi ? 'border-accent/40 shadow-[0_0_0_3px_rgba(43,68,224,0.08)]' : 'border-craie/80 shadow-[0_1px_2px_rgba(18,18,18,0.03)]'
      } ${fini ? 'opacity-70' : ''}`}
    >
      {aMoi && <span className="absolute right-0 top-0 rounded-bl-xl bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-white">À toi</span>}
      <div className="pr-10 text-[15px] font-extrabold leading-tight tracking-tight">{d.business || d.nom}</div>
      {d.business && <div className="mt-0.5 truncate text-[12.5px] text-pierre">{d.nom}</div>}
      <div className="mt-2.5 text-[13px] font-semibold leading-snug text-encre/80">{S.etatTexte(d)}</div>
      {a && a.total > 0 && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-craie">
          <motion.div className={`h-full rounded-full ${d.etape === 'livre' ? 'bg-vert' : 'bg-encre'}`} initial={{ width: 0 }} animate={{ width: `${(a.faits / a.total) * 100}%` }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }} />
        </div>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        {fini ? <span className="text-[11px] font-semibold text-pierre">{d.perdu ? 'Perdu' : `Livré`}</span> : <Balle d={d} />}
        <span className="flex items-center gap-1.5">
          {total > 0 && <span className="text-[12px] font-bold tabular text-encre/70">{eurosCourts(total)}</span>}
          <PastilleSuivi d={d} />
        </span>
      </div>
    </motion.button>
  )
}

export default function Tableau({ aller }) {
  const { data, moi } = useStore()
  const [filtre, setFiltre] = useState('tous')
  const [voirLivres, setVoirLivres] = useState(false)
  const [voirPerdus, setVoirPerdus] = useState(false)

  const visibles = useMemo(() => data.dossiers.filter((d) => {
    if (filtre === 'moi') return W.aMoiDeJouer(d, moi.id)
    if (filtre === 'retard') return !d.perdu && S.niveau(d) === 'rouge'
    return true
  }), [data.dossiers, filtre, moi.id])

  const actifs = data.dossiers.filter((d) => !d.perdu && d.etape !== 'livre')
  const perdus = data.dossiers.filter((d) => d.perdu)
  const enRetard = actifs.filter((d) => S.niveau(d) === 'rouge').length
  const aMoi = actifs.filter((d) => W.aMoiDeJouer(d, moi.id)).length
  const mois = aujourdhui().slice(0, 7)
  const enDevis = actifs.filter((d) => ['validation', 'envoye'].includes(d.etape)).reduce((s, d) => s + W.totalDevis(d.devis).total, 0)
  const signe = data.dossiers.filter((d) => jourLocal(d.devis?.signeLe).slice(0, 7) === mois).reduce((s, d) => s + W.totalDevis(d.devis).total, 0)
  const aEncaisser = data.dossiers.filter((d) => d.delivery).flatMap((d) => d.delivery.paiements).filter((p) => !p.recuLe).reduce((s, p) => s + p.montant, 0)

  const trier = (l) => [...l].sort((a, b) => Number(W.aMoiDeJouer(b, moi.id)) - Number(W.aMoiDeJouer(a, moi.id)) || POIDS[S.niveau(a)] - POIDS[S.niveau(b)] || S.attente(b) - S.attente(a))

  return (
    <>
      <EnTete surtitre={`${actifs.length} dossiers en cours`} titre="Le tableau," accent="qui a la balle ?" sousTitre="Chaque carte montre qui doit agir et depuis combien de temps le dossier attend." />

      {/* Bande de chiffres + filtres */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="sans-barre -mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
          <Onglets valeur={filtre} onChange={setFiltre} options={[
            { id: 'tous', label: 'Tout le monde' },
            { id: 'moi', label: `À moi · ${aMoi}` },
            { id: 'retard', label: `En retard · ${enRetard}` },
          ]} />
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px]">
          <span><span className="text-pierre">En devis</span> <b className="tabular">{eurosCourts(enDevis)}</b></span>
          <span><span className="text-pierre">Signé ce mois</span> <b className="tabular">{eurosCourts(signe)}</b></span>
          <span><span className="text-pierre">À encaisser</span> <b className="tabular">{eurosCourts(aEncaisser)}</b></span>
        </div>
      </div>

      {/* Légende */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px] text-pierre">
        {MEMBRES.map((m) => <span key={m.id} className="inline-flex items-center gap-1.5"><AvatarMembre id={m.id} taille="xs" plein /> {m.nom} · {m.titre.toLowerCase()}</span>)}
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F5A04A]" /> à faire aujourd’hui (2 j d’attente ou date du jour)</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#E5484D]" /> en retard (5 j ou date dépassée)</span>
      </div>

      {/* Les 4 colonnes */}
      <LayoutGroup>
        <div className="sans-barre -mx-4 mt-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 xl:grid-cols-4">
          {PHASES.map((ph, c) => {
            const m = membre(ph.qui)
            const tous = visibles.filter((d) => !d.perdu && ph.etapes.includes(d.etape))
            const enCours = trier(tous.filter((d) => d.etape !== 'livre'))
            const livres = tous.filter((d) => d.etape === 'livre')
            const somme = ph.id === 'devis' ? enCours.reduce((s, d) => s + W.totalDevis(d.devis).total, 0) : 0
            return (
              <motion.section key={ph.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: c * 0.07 }}
                className="w-[84vw] max-w-[360px] shrink-0 snap-start rounded-[24px] bg-craie/45 p-2.5 md:w-auto md:max-w-none">
                <div className="flex items-center justify-between px-2 pb-3 pt-1.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: m.fond, color: m.couleur }}><Icone nom={ph.icone} className="h-3.5 w-3.5" epaisseur={2.2} /></span>
                    <span className="text-[15px] font-extrabold tracking-tight">{ph.label}</span>
                    <span className="rounded-full bg-white px-1.5 text-[12px] font-bold text-pierre">{enCours.length}</span>
                  </div>
                  <span className="text-[12px] text-pierre">{somme ? <b className="text-encre">{euros(somme)}</b> : m.nom}</span>
                </div>
                <div className="space-y-2">
                  <Presence initial={false}>
                    {enCours.map((d, i) => <Carte key={d.id} d={d} moiId={moi.id} aller={aller} i={i} />)}
                  </Presence>
                  {enCours.length === 0 && <div className="rounded-[18px] border border-dashed border-craie px-4 py-8 text-center font-serif text-[14px] italic text-pierre">{filtre === 'tous' ? 'Rien ici pour l’instant.' : 'Rien pour ce filtre.'}</div>}
                  {ph.id === 'prospection' && (
                    <button onClick={() => aller('tableau/nouveau')} className="flex w-full items-center justify-center gap-1.5 rounded-[14px] py-2.5 text-[13px] font-bold text-pierre transition hover:bg-white hover:text-encre">
                      <Icone nom="plus" className="h-4 w-4" epaisseur={2.2} /> Ajouter un prospect
                    </button>
                  )}
                </div>
                {livres.length > 0 && (
                  <div className="mt-3">
                    <button onClick={() => setVoirLivres(!voirLivres)} className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-[13px] font-bold text-pierre transition hover:text-encre">
                      <span className="inline-flex items-center gap-1.5"><Icone nom="coche" className="h-3.5 w-3.5 text-vert" epaisseur={2.6} /> Livrés · {livres.length}</span>
                      <Icone nom="bas" className={`h-4 w-4 transition ${voirLivres ? 'rotate-180' : ''}`} />
                    </button>
                    <Presence initial={false}>
                      {voirLivres && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="space-y-2 overflow-hidden">
                          {livres.map((d, i) => <Carte key={d.id} d={d} moiId={moi.id} aller={aller} i={i} />)}
                        </motion.div>
                      )}
                    </Presence>
                  </div>
                )}
              </motion.section>
            )
          })}
        </div>
      </LayoutGroup>

      {perdus.length > 0 && (
        <div className="mt-6">
          <button onClick={() => setVoirPerdus(!voirPerdus)} className="inline-flex items-center gap-1.5 text-[13px] font-bold text-pierre transition hover:text-encre">
            {perdus.length} dossier{perdus.length > 1 ? 's' : ''} perdu{perdus.length > 1 ? 's' : ''} <Icone nom="bas" className={`h-4 w-4 transition ${voirPerdus ? 'rotate-180' : ''}`} />
          </button>
          <Presence initial={false}>
            {voirPerdus && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 grid grid-cols-1 gap-2 overflow-hidden sm:grid-cols-2 xl:grid-cols-4">
                {perdus.map((d, i) => <Carte key={d.id} d={d} moiId={moi.id} aller={aller} i={i} />)}
              </motion.div>
            )}
          </Presence>
        </div>
      )}
    </>
  )
}
