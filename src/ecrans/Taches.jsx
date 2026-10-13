// Mes tâches : l'accueil de chacun. Une liste, rangée par échéance, avec le bouton qui règle chaque tâche.
import { useMemo } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { membre } from '../config.js'
import { dateCourte, euros } from '../lib.js'
import { useStore } from '../store.jsx'
import { Apparition, AvatarMembre, Bouton, Compteur, EASE, EnTete, Icone, Presence, RESSORT, SymboleAnime } from '../ui.jsx'
import { BoutonsAction } from '../dossier/Actions.jsx'
import { initialesDossier } from '../dossier/commun.jsx'
import * as S from '../suivi.js'
import * as W from '../workflow.js'

const TON = { rouge: 'text-[#B42318]', orange: 'text-[#A4520A]', ok: 'text-pierre' }

function LigneTache({ t, aller }) {
  const { d } = t
  const e = S.texteEcheance(t)
  const n = S.niveau(d)
  return (
    <motion.div
      layout layoutId={`tache-${d.id}`}
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
      transition={{ duration: 0.4, ease: EASE, layout: RESSORT }}
      onClick={() => aller(`dossier/${d.id}`)}
      className="group relative cursor-pointer overflow-hidden rounded-[20px] border border-craie/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(18,18,18,0.03)] transition-[box-shadow,border-color] duration-300 hover:border-craie hover:shadow-[0_18px_40px_-24px_rgba(18,18,18,0.3)] md:px-5"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${n === 'rouge' ? 'bg-[#E5484D]' : n === 'orange' ? 'bg-[#F5A04A]' : 'bg-accent'}`} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-papier text-[13px] font-extrabold tracking-tight">{initialesDossier(d)}</span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-[16px] font-extrabold tracking-tight">{t.titre}</span>
              <span className={`text-[12px] font-bold ${TON[e.niveau]}`}>· {e.texte}</span>
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[13.5px] text-pierre">
              <span className="font-semibold text-encre/80">{d.business || d.nom}</span>
              {d.business && <span>{d.nom}</span>}
              {d.devis && W.totalDevis(d.devis).total > 0 && ['validation', 'envoye', 'devis'].includes(d.etape) && <span className="font-semibold tabular text-encre/70">· {euros(W.totalDevis(d.devis).total)}</span>}
            </div>
            {t.detail && <p className="mt-1.5 line-clamp-2 font-serif text-[14.5px] italic text-encre/75">« {t.detail} »</p>}
          </div>
        </div>
        <div className="flex items-center md:justify-end">
          <BoutonsAction d={d} ids={t.actions} aller={aller} />
        </div>
      </div>
    </motion.div>
  )
}

// Ce que j'ai lancé et qui attend maintenant les autres.
function JAttends({ dossiers, moi, aller }) {
  const liste = dossiers.filter((d) => !d.perdu && d.etape !== 'livre' && !W.aMoiDeJouer(d, moi.id) && d.historique.find((h) => h.type === 'etape')?.qui === moi.id).slice(0, 6)
  if (!liste.length) return null
  return (
    <section className="mt-14">
      <h2 className="mb-1 text-[18px] font-extrabold tracking-tight">Chez les autres</h2>
      <p className="mb-4 font-serif text-[15px] italic text-pierre">Ce que tu as fait avancer et qui attend maintenant quelqu’un d’autre.</p>
      <div className="space-y-1.5">
        {liste.map((d, i) => {
          const qui = S.balle(d)
          return (
            <Apparition key={d.id} i={i}>
              <button onClick={() => aller(`dossier/${d.id}`)} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-white">
                <span className="flex -space-x-1.5">{qui.map((m) => <AvatarMembre key={m.id} id={m.id} taille="sm" plein anneau />)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">
                  <b className="font-semibold">{d.business || d.nom}</b> <span className="text-pierre">· {S.etatTexte(d)} · chez {qui.map((m) => m.nom).join(', ')}</span>
                </span>
                <span className={`whitespace-nowrap text-xs font-bold ${S.niveau(d) === 'rouge' ? 'text-[#B42318]' : S.niveau(d) === 'orange' ? 'text-[#A4520A]' : 'text-pierre'}`}>{S.texteAttente(d)}</span>
              </button>
            </Apparition>
          )
        })}
      </div>
    </section>
  )
}

export default function Taches({ aller }) {
  const { data, moi } = useStore()
  const taches = useMemo(() => S.mesTaches(data.dossiers, moi.id), [data.dossiers, moi.id])
  const par = Object.fromEntries(S.GROUPES.map((g) => [g.id, taches.filter((t) => S.groupe(t) === g.id)]))
  const date = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const accent = taches.length === 0 ? 'rien ne t’attend.' : taches.length === 1 ? 'une chose à faire.' : `${taches.length} choses à faire.`
  const role = membre(moi.id)

  return (
    <>
      <EnTete surtitre={date} titre={`Salut ${moi.nom},`} accent={accent} sousTitre={`${role.titre} · le reste de l’équipe voit tout dans le tableau.`} />

      {/* Résumé : trois compteurs, un clic descend au groupe */}
      <div className="grid grid-cols-3 gap-2.5 md:max-w-2xl md:gap-3">
        {[
          { id: 'retard', label: 'En retard', fond: par.retard.length ? 'bg-[#FDE0DD] text-[#B42318]' : 'carte' },
          { id: 'aujourdhui', label: 'Aujourd’hui', fond: 'bg-encre text-papier' },
          { id: 'semaine', label: 'Cette semaine', fond: 'carte' },
        ].map((k, i) => (
          <Apparition key={k.id} i={i}>
            <button onClick={() => document.getElementById(`groupe-${k.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })} className={`w-full rounded-[20px] p-4 text-left transition hover:-translate-y-0.5 ${k.fond}`}>
              <div className="text-[10px] font-semibold uppercase leading-tight tracking-[0.08em] opacity-70 sm:text-[11px] sm:tracking-[0.12em]">{k.label}</div>
              <div className="mt-2 text-[34px] font-extrabold leading-none tabular"><Compteur valeur={par[k.id].length} /></div>
            </button>
          </Apparition>
        ))}
      </div>

      <LayoutGroup>
        <div className="mt-10 space-y-10">
          <Presence>
            {taches.length === 0 && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center rounded-[28px] border border-dashed border-craie bg-white/40 px-6 py-16 text-center">
                <SymboleAnime className="h-12 w-12" />
                <div className="mt-5 text-xl font-extrabold tracking-tight">Tout est à jour.</div>
                <p className="mt-1 max-w-sm font-serif text-[17px] italic text-pierre">Dès qu’un dossier arrive chez toi, il apparaît ici.</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  {moi.role === 'prospection' && <Bouton icone="plus" onClick={() => aller('taches/nouveau')}>Ajouter un prospect</Bouton>}
                  <button onClick={() => aller('tableau')} className="inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline">Voir le tableau <Icone nom="fleche" className="h-4 w-4" /></button>
                </div>
              </motion.div>
            )}
          </Presence>
          {S.GROUPES.map((g) => par[g.id].length > 0 && (
            <section key={g.id} id={`groupe-${g.id}`} className="scroll-mt-28">
              <div className="mb-3 flex items-center gap-2.5">
                {g.id === 'retard' && <span className="h-2 w-2 rounded-full bg-[#E5484D]" />}
                <h2 className={`text-[18px] font-extrabold tracking-tight ${g.id === 'retard' ? 'text-[#B42318]' : ''}`}>{g.label}</h2>
                <span className="text-sm font-semibold text-pierre">{par[g.id].length}</span>
                {g.id === 'plus_tard' && <span className="text-xs text-pierre">après le {dateCourte(par[g.id][0].echeance)}</span>}
              </div>
              <div className="space-y-2">
                <Presence initial={false}>
                  {par[g.id].map((t) => <LigneTache key={t.d.id} t={t} aller={aller} />)}
                </Presence>
              </div>
            </section>
          ))}
        </div>
      </LayoutGroup>

      <JAttends dossiers={data.dossiers} moi={moi} aller={aller} />
    </>
  )
}
