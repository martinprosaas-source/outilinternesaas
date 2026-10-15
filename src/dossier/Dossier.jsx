// La page d'un dossier : en-tête, les 4 phases, la prochaine action, puis le contenu de chaque phase (repliable).
import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { MEMBRES, PHASES, membre } from '../config.js'
import { dateCourte, dateLongue, depuis, euros } from '../lib.js'
import { useDossier } from '../store.jsx'
import { AvatarMembre, Bouton, EASE, Fenetre, Icone, Menu, Presence, Progression, Surtitre, TexteLibre, Tiroir } from '../ui.jsx'
import { BoutonsAction } from './Actions.jsx'
import { PastillePhase, PastilleSuivi } from './commun.jsx'
import OngletProspection from './OngletProspection.jsx'
import OngletAudit from './OngletAudit.jsx'
import OngletDevis from './OngletDevis.jsx'
import OngletDelivery from './OngletDelivery.jsx'
import * as S from '../suivi.js'
import * as W from '../workflow.js'

const CONTENUS = { prospection: OngletProspection, audit: OngletAudit, devis: OngletDevis, delivery: OngletDelivery }
const rangPhase = (d) => PHASES.findIndex((p) => p.etapes.includes(d.etape))

// Ce qu'on retient d'une phase, en une ligne.
function resume(d, ph, enCours) {
  if (enCours) return S.etatTexte(d)
  if (ph.id === 'prospection') return d.prospection.gagneLe ? `Call signé le ${dateCourte(d.prospection.gagneLe)}` : 'Terminée'
  if (ph.id === 'audit') {
    const ind = W.normaliserAudit(d.audit).besoins.filter((b) => b.priorite === 'indispensable')
    return `${ind.filter((b) => b.revue?.verdict && b.revue.verdict !== 'non').length}/${ind.length} besoins retenus`
  }
  if (ph.id === 'devis') return `${d.devis.numero} · ${euros(W.totalDevis(d.devis).total)} · signé le ${dateCourte(d.devis.signeLe)}`
  return S.etatTexte(d)
}

// ─────────────────────────── Les 4 phases ───────────────────────────
function Phases({ d, ouvrir }) {
  const r = d.etape === 'livre' ? PHASES.length : rangPhase(d)
  return (
    <div className="grid grid-cols-4 gap-1.5 md:gap-2">
      {PHASES.map((ph, i) => {
        const m = membre(ph.qui)
        const fait = i < r
        const ici = i === r
        return (
          <motion.button
            key={ph.id} type="button" disabled={i > r} onClick={() => ouvrir(ph.id)}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: i * 0.06 }}
            className={`relative flex min-w-0 flex-col overflow-hidden rounded-2xl p-2 text-left transition sm:p-2.5 md:p-4 ${
              ici ? 'bg-white shadow-[0_14px_36px_-20px_rgba(18,18,18,0.35)] ring-2' : fait ? 'bg-white/70 hover:bg-white' : 'border border-dashed border-craie'
            } disabled:cursor-default`}
            style={ici ? { '--tw-ring-color': d.perdu ? '#E5484D' : m.couleur } : undefined}
          >
            {ici && !d.perdu && <motion.span className="absolute inset-x-0 top-0 h-1" style={{ background: m.couleur }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: EASE, delay: 0.3 }} />}
            <div className="flex items-center gap-2">
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${fait ? 'bg-encre text-papier' : ''}`} style={!fait ? { background: i > r ? 'transparent' : m.fond, color: i > r ? '#6B6660' : m.couleur } : undefined}>
                {fait ? <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} /> : <Icone nom={ph.icone} className="h-3.5 w-3.5" epaisseur={2.2} />}
              </span>
              <span className={`hidden truncate text-[14px] font-extrabold tracking-tight sm:block ${i > r ? 'text-pierre' : ''}`}>{ph.label}</span>
            </div>
            <span className={`mt-1.5 text-[10px] font-bold leading-tight tracking-[-0.01em] sm:hidden ${i > r ? 'text-pierre' : ''}`}>{ph.label}</span>
            <span className="mt-1 hidden truncate text-[12.5px] text-pierre md:block">{i > r ? m.nom : resume(d, ph, ici)}</span>
          </motion.button>
        )
      })}
    </div>
  )
}

// ─────────────────────────── La prochaine action ───────────────────────────
// Dans la page dossier, « ouvrir l'audit » devient directement l'action de l'étape.
function actionsPage(d, t) {
  const remplace = {
    ouvrir_audit: ['envoyer_revue'],
    ouvrir_revue: ['valider_audit', 'renvoyer'],
    ouvrir_devis: ['soumettre_devis', 'pdf'],
    ouvrir_delivery: [],
  }
  let ids = t.actions.flatMap((id) => remplace[id] ?? [id])
  if (d.etape === 'envoye') ids = [...ids, ...(d.devis.accepteLe ? [] : ['accepte']), 'modif_client', 'pdf']
  if (d.etape === 'validation' && !ids.includes('pdf')) ids = [...ids, 'pdf']
  return [...new Set(ids)]
}

const AIDE = {
  audit: 'Suis les 9 blocs pendant les entretiens : chaque case cochée, ou notée en question ouverte. Puis liste les besoins.',
  revue: 'Lis le livrable plus bas, donne un verdict et des jours à chaque besoin indispensable, puis valide ou renvoie à Hugo.',
  devis: 'Ajuste les lignes et les conditions plus bas, puis soumets à Nino et Hugo.',
  delivery: 'Fais avancer chaque livrable plus bas. Le projet se clôture quand tout est livré.',
}

function Votes({ d }) {
  return (
    <div className="flex flex-wrap gap-2">
      {MEMBRES.map((m) => {
        const date = d.devis.validations?.[m.id]
        return (
          <span key={m.id} className={`inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-[12.5px] font-bold ${date ? 'bg-vert/15 text-[#7CE0AE]' : 'bg-white/10 text-papier/60'}`}>
            <AvatarMembre id={m.id} taille="sm" plein />
            {m.nom} {date ? <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} /> : <span className="font-semibold">· en attente</span>}
          </span>
        )
      })}
    </div>
  )
}

function CarteAction({ d, moi, aller }) {
  const t = S.tache(d, moi.id)
  if (d.perdu) return null
  if (d.etape === 'livre') {
    return (
      <div className="flex items-center gap-3 rounded-[22px] bg-vert/10 px-5 py-4 text-vert">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-vert text-white"><Icone nom="coche" className="h-4 w-4" epaisseur={3} /></span>
        <div><div className="font-extrabold">Projet livré</div><div className="text-sm opacity-80">le {dateLongue(d.delivery.livreLe)}{d.devis.maintenance ? ` · maintenance ${euros(d.devis.maintenance)}/mois` : ''}</div></div>
      </div>
    )
  }
  const a = d.delivery ? W.avancement(d) : null
  const extra = (
    <>
      {d.etape === 'validation' && <div className="mt-4"><Votes d={d} /></div>}
      {d.etape === 'delivery' && a && <div className="mt-4 max-w-md"><Progression faits={a.faits} total={a.total} epais couleur="bg-accent" /></div>}
      {d.etape === 'audit' && <div className="mt-4 max-w-md"><Progression faits={W.completionAudit(d.audit).faits} total={W.completionAudit(d.audit).total} couleur="bg-accent" /></div>}
    </>
  )

  if (!t) {
    const qui = S.balle(d)
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-[22px] border border-craie bg-white px-5 py-4">
        <span className="flex -space-x-2">{qui.map((m) => <AvatarMembre key={m.id} id={m.id} taille="lg" plein anneau />)}</span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-pierre">En attente de</div>
          <div className="text-lg font-extrabold tracking-tight">{qui.map((m) => m.nom).join(' et ')} <span className="font-serif font-normal italic text-pierre">· {S.etatTexte(d).toLowerCase()}</span></div>
          {d.etape === 'validation' && <div className="mt-2 flex gap-1.5">{MEMBRES.map((m) => <span key={m.id} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${d.devis.validations?.[m.id] ? 'bg-vert/10 text-vert' : 'bg-papier text-pierre'}`}>{m.nom} {d.devis.validations?.[m.id] ? '✓' : '…'}</span>)}</div>}
        </div>
        <PastilleSuivi d={d} />
      </div>
    )
  }

  const e = S.texteEcheance(t)
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="relative overflow-hidden rounded-[24px] bg-encre px-5 py-5 text-papier shadow-[0_30px_60px_-30px_rgba(18,18,18,0.8)] md:px-7 md:py-6">
      <motion.span className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-accent/50 blur-3xl" animate={{ scale: [1, 1.18, 1], opacity: [0.8, 1, 0.8] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8EA0FF]" /><span className="relative inline-flex h-2 w-2 rounded-full bg-[#8EA0FF]" /></span>
          <span className="text-[#AEBBFF]">À toi de jouer</span>
          <span className={e.niveau === 'rouge' ? 'text-[#FF9C94]' : e.niveau === 'orange' ? 'text-[#FFC98A]' : 'text-papier/50'}>· {e.texte}</span>
        </div>
        <div className="mt-2 text-[24px] font-extrabold leading-tight tracking-tight md:text-[28px]">{t.titre}</div>
        {t.detail && <p className="mt-2 max-w-2xl font-serif text-[16px] italic text-papier/80">« {t.detail} »</p>}
        {AIDE[d.etape] && <p className="mt-1.5 max-w-2xl text-[14px] text-papier/55">{AIDE[d.etape]}</p>}
        {extra}
        {actionsPage(d, t).length > 0 && <div className="mt-5"><BoutonsAction d={d} ids={actionsPage(d, t)} taille="md" sombre aller={aller} suivre /></div>}
      </div>
    </motion.div>
  )
}

// ─────────────────────────── Fil (commentaires + historique) ───────────────────────────
function Fil({ d }) {
  const { commenter, moi } = useDossier(d.id)
  const [texte, setTexte] = useState('')
  const envoyer = () => { commenter(d.id, texte); setTexte('') }
  const entrees = [...d.historique].sort((a, b) => (a.date < b.date ? 1 : -1))
  return (
    <div>
      <div className="rounded-2xl border border-craie bg-white p-2">
        <TexteLibre valeur={texte} onChange={setTexte} lignes={2} placeholder="Un commentaire pour l’équipe…" className="!border-0 !shadow-none !ring-0" />
        <div className="flex items-center justify-between px-1.5 pb-1">
          <span className="text-[11px] text-pierre">Visible par Nino, Hugo et Martin</span>
          <Bouton taille="sm" variante="encre" icone="envoyer" disabled={!texte.trim()} onClick={envoyer}>Envoyer</Bouton>
        </div>
      </div>
      <div className="relative mt-6">
        <span className="absolute bottom-2 left-[11px] top-2 w-px bg-craie" />
        <div className="space-y-3">
          <Presence initial={false}>
            {entrees.map((h) => (
              <motion.div key={h.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="relative flex gap-3">
                <span className="relative z-10 mt-0.5"><AvatarMembre id={h.qui} taille="sm" plein anneau /></span>
                {h.type === 'commentaire' ? (
                  <div className={`min-w-0 flex-1 rounded-2xl rounded-tl-md px-3.5 py-2.5 ${h.qui === moi.id ? 'bg-encre text-papier' : 'border border-craie bg-white'}`}>
                    <div className="text-[13.5px] leading-relaxed">{h.texte}</div>
                    <div className={`mt-1 text-[11px] ${h.qui === moi.id ? 'text-papier/50' : 'text-pierre'}`}>{membre(h.qui)?.nom} · {depuis(h.date)}</div>
                  </div>
                ) : (
                  <div className="min-w-0 flex-1 pt-0.5 text-[13px] leading-snug">
                    {/^[A-ZÉ]/.test(h.texte) ? <b className="font-semibold">{h.texte}</b> : <><b className="font-semibold">{membre(h.qui)?.nom}</b> <span className="text-encre/75">{h.texte}</span></>}
                    <div className="mt-0.5 text-[11px] text-pierre">{depuis(h.date)}</div>
                  </div>
                )}
              </motion.div>
            ))}
          </Presence>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────── Page ───────────────────────────
export default function Dossier({ id, onglet, aller }) {
  const { d, moi, agir, supprimer, notifier } = useDossier(id)
  const [fil, setFil] = useState(false)
  const [supp, setSupp] = useState(false)
  const courante = d ? (d.etape === 'livre' ? 'delivery' : PHASES[rangPhase(d)].id) : null
  const [ouverte, setOuverte] = useState(onglet || courante)
  const refs = useRef({})

  // Une action qui ouvre une phase (« Ouvrir l'audit ») passe par l'adresse : on déplie et on descend.
  useEffect(() => {
    if (!onglet) return
    setOuverte(onglet)
    const t = setTimeout(() => refs.current[onglet]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350)
    return () => clearTimeout(t)
  }, [onglet])
  // Le dossier change de phase : on déplie la nouvelle.
  useEffect(() => { if (courante && !onglet) setOuverte(courante) }, [courante]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!d) return null
  const r = d.etape === 'livre' ? PHASES.length - 1 : rangPhase(d)
  const atteintes = PHASES.filter((_, i) => i <= r)
  const total = W.totalDevis(d.devis).total
  const nbCommentaires = d.historique.filter((h) => h.type === 'commentaire').length
  const basculer = (ph) => setOuverte((o) => (o === ph ? null : ph))
  const allerPhase = (ph) => { setOuverte(ph); setTimeout(() => refs.current[ph]?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120) }

  return (
    <>
      <button onClick={() => (window.history.length > 1 ? window.history.back() : aller('tableau'))} className="group mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-pierre transition hover:text-encre">
        <Icone nom="gauche" className="h-4 w-4 transition group-hover:-translate-x-0.5" /> Retour
      </button>

      {/* En-tête */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mb-3 flex flex-wrap items-center gap-2">
            <PastillePhase d={d} />
            <PastilleSuivi d={d} />
            {d.niche && <span className="text-[12px] font-semibold text-pierre">{d.niche}</span>}
            {d.canal && <span className="text-[12px] text-pierre">· via {d.canal}</span>}
          </motion.div>
          <h1 className="text-[32px] font-extrabold leading-[1.02] tracking-[-0.035em] md:text-[46px]">
            <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
              <motion.span className="inline-block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE }}>{d.business || d.nom}</motion.span>
            </span>
            {d.business && (
              <span className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span className="ml-3 inline-block font-serif font-normal italic tracking-[-0.02em] text-pierre" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.08 }}>{d.nom}</motion.span>
              </span>
            )}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-pierre">
            {d.contact?.instagram && <span className="inline-flex items-center gap-1.5"><Icone nom="instagram" className="h-3.5 w-3.5" />{d.contact.instagram}</span>}
            {d.contact?.email && <a href={`mailto:${d.contact.email}`} className="inline-flex items-center gap-1.5 hover:text-encre"><Icone nom="mail" className="h-3.5 w-3.5" />{d.contact.email}</a>}
            {d.contact?.telephone && <a href={`tel:${d.contact.telephone}`} className="inline-flex items-center gap-1.5 hover:text-encre"><Icone nom="telephone" className="h-3.5 w-3.5" />{d.contact.telephone}</a>}
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {total > 0 && (
            <div className="mr-1 text-right">
              <div className="text-[24px] font-extrabold leading-none tracking-tight tabular">{euros(total)}</div>
              <div className="mt-1 text-xs text-pierre">{d.devis.numero}{d.devis.maintenance > 0 ? ` · + ${euros(d.devis.maintenance)}/mois` : ''}</div>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.94 }} onClick={() => setFil(true)} className="relative flex h-10 items-center gap-2 rounded-full border border-craie bg-white px-3.5 text-sm font-semibold transition hover:border-encre/30">
            <Icone nom="bulle" className="h-4 w-4" /> Fil
            {nbCommentaires > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-encre px-1.5 text-[10px] font-bold text-papier">{nbCommentaires}</span>}
          </motion.button>
          <Menu items={[
            d.perdu ? { label: 'Réactiver le dossier', icone: 'reset', onClick: () => agir(d.id, (x) => W.reactiver(x, moi.id), 'Dossier réactivé') }
              : !['delivery', 'livre'].includes(d.etape) && { label: 'Classer comme perdu', icone: 'attention', onClick: () => setSupp('perdu') },
            { label: 'Supprimer le dossier', icone: 'corbeille', danger: true, onClick: () => setSupp('supprimer') },
          ]}>
            <button className="flex h-10 w-10 items-center justify-center rounded-full border border-craie bg-white text-pierre transition hover:border-encre/30 hover:text-encre" aria-label="Plus d’actions"><Icone nom="points" className="h-5 w-5" epaisseur={3} /></button>
          </Menu>
        </div>
      </div>

      {d.perdu && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#FDE0DD] px-4 py-3 text-sm text-[#8A1C12]">
          <Icone nom="attention" className="h-4 w-4" /> <span className="flex-1"><b>Perdu</b> {d.perdu.raison ? `· ${d.perdu.raison}` : ''} <span className="opacity-70">({depuis(d.perdu.date)})</span></span>
          <Bouton taille="sm" variante="secondaire" icone="reset" onClick={() => agir(d.id, (x) => W.reactiver(x, moi.id), 'Dossier réactivé')}>Réactiver</Bouton>
        </div>
      )}

      <div className="mt-7"><Phases d={d} ouvrir={allerPhase} /></div>
      <div className="mt-4"><CarteAction d={d} moi={moi} aller={aller} /></div>

      {/* Contenu de chaque phase atteinte : la phase en cours est dépliée, les autres résumées. */}
      <div className="mt-8 space-y-3">
        {atteintes.map((ph, i) => {
          const Contenu = CONTENUS[ph.id]
          const ouvert = ouverte === ph.id
          const m = membre(ph.qui)
          const enCours = ph.id === courante && d.etape !== 'livre'
          return (
            <section key={ph.id} ref={(el) => (refs.current[ph.id] = el)} className="scroll-mt-24">
              <button onClick={() => basculer(ph.id)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-left transition ${ouvert ? '' : 'bg-white/60 hover:bg-white'}`}>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={enCours ? { background: m.fond, color: m.couleur } : { background: '#121212', color: '#F4F2EE' }}>
                  {enCours ? <Icone nom={ph.icone} className="h-4 w-4" epaisseur={2.2} /> : <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[17px] font-extrabold tracking-tight">{ph.label}</span>
                  {!ouvert && <span className="block truncate text-[13px] text-pierre">{resume(d, ph, enCours)}</span>}
                </span>
                <AvatarMembre id={m.id} taille="sm" />
                <Icone nom="bas" className={`h-4 w-4 text-pierre transition ${ouvert ? 'rotate-180' : ''}`} />
              </button>
              <Presence initial={false}>
                {ouvert && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: EASE }} className="overflow-hidden">
                    <div className="pb-4 pt-2"><Contenu d={d} moi={moi} aller={aller} /></div>
                  </motion.div>
                )}
              </Presence>
              {i < atteintes.length - 1 && !ouvert && <div className="h-px" />}
            </section>
          )
        })}
      </div>

      <Presence>
        {fil && (
          <Tiroir onFermer={() => setFil(false)} entete={<><Surtitre>Fil du dossier</Surtitre><div className="mt-1 text-2xl font-extrabold tracking-tight">{d.business || d.nom}</div><div className="mt-1 text-sm text-pierre">Commentaires de l’équipe et tout ce qui s’est passé.</div></>}>
            <Fil d={d} />
          </Tiroir>
        )}
      </Presence>
      <Presence>
        {supp === 'supprimer' && (
          <Fenetre surtitre={d.business || d.nom} titre="Supprimer le dossier ?" onFermer={() => setSupp(false)}
            actions={<><Bouton variante="discret" onClick={() => setSupp(false)}>Annuler</Bouton><Bouton variante="encre" icone="corbeille" onClick={() => { supprimer(d.id); notifier('Dossier supprimé'); aller('tableau') }}>Supprimer</Bouton></>}>
            <p className="text-[15px]">L’audit, le devis et tout l’historique seront effacés. Pour garder une trace, classe-le plutôt comme perdu.</p>
          </Fenetre>
        )}
      </Presence>
      <Presence>{supp === 'perdu' && <PerduFenetre d={d} onFermer={() => setSupp(false)} />}</Presence>
    </>
  )
}

// « Classer comme perdu » depuis le menu du dossier.
function PerduFenetre({ d, onFermer }) {
  const { agir, moi } = useDossier(d.id)
  const [raison, setRaison] = useState('')
  return (
    <Fenetre surtitre={d.business || d.nom} titre="Classer comme perdu" onFermer={onFermer}
      actions={<><Bouton variante="discret" onClick={onFermer}>Annuler</Bouton><Bouton variante="encre" onClick={() => agir(d.id, (x) => W.perdre(x, moi.id, raison), 'Dossier classé comme perdu') && onFermer()}>Classer perdu</Bouton></>}>
      <span className="etiquette">Pourquoi ?</span>
      <TexteLibre valeur={raison} onChange={setRaison} placeholder="Pas de budget, déjà équipé, ne répond plus…" />
    </Fenetre>
  )
}

