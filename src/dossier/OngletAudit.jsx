// Onglet Audit : Hugo remplit l'état des lieux et ce qu'on peut leur faire ; Martin fait la revue technique.
import { motion } from 'motion/react'
import { CANAUX, CATALOGUE, OUTILS, TARIFS } from '../config.js'
import { depuis, euros, uid } from '../lib.js'
import { useStore } from '../store.jsx'
import { AvatarMembre, Champ, EASE, Icone, Pastille, PlusMoins, Presence, Progression, Puces, RESSORT, Surtitre, TexteLibre } from '../ui.jsx'
import { nomMembre } from './commun.jsx'
import { BoutonsAction } from './Actions.jsx'
import * as W from '../workflow.js'

// Un champ qui devient du texte quand l'audit n'est plus modifiable.
function Saisie({ edition, valeur, onChange, placeholder, suffixe, type = 'text' }) {
  if (!edition) return <div className="min-h-[44px] rounded-xl bg-papier/70 px-3.5 py-2.5 text-[15px]">{valeur ? <>{valeur}{suffixe ? ` ${suffixe}` : ''}</> : <span className="text-pierre/60">—</span>}</div>
  return (
    <div className="relative">
      <input type={type} className={`champ ${suffixe ? 'pr-16' : ''}`} value={valeur || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {suffixe && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-pierre">{suffixe}</span>}
    </div>
  )
}
function Texte({ edition, valeur, onChange, placeholder }) {
  if (!edition) return <div className="whitespace-pre-line rounded-xl bg-papier/70 px-3.5 py-2.5 text-[15px] leading-relaxed">{valeur || <span className="text-pierre/60">—</span>}</div>
  return <TexteLibre valeur={valeur} onChange={onChange} placeholder={placeholder} lignes={2} />
}

function Section({ id, numero, titre, fait, children, note }) {
  return (
    <motion.section id={`audit-${id}`} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -40px 0px' }} transition={{ duration: 0.55, ease: EASE }} className="carte scroll-mt-28 p-5 md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold transition-colors ${fait ? 'bg-vert text-white' : 'bg-papier text-pierre'}`}>
          {fait ? <Icone nom="coche" className="h-3.5 w-3.5" epaisseur={3} /> : numero}
        </span>
        <h3 className="text-[17px] font-extrabold tracking-tight">{titre}</h3>
        {note && <span className="ml-auto hidden font-serif text-[14px] italic text-pierre sm:block">{note}</span>}
      </div>
      {children}
    </motion.section>
  )
}

const TONS_VERDICT = { ok: 'bg-vert text-white', reserve: 'bg-ambre text-white', non: 'bg-red-700 text-white' }

function Proposition({ p, i, edition, revue, onChange, onSupprimer }) {
  const v = p.revue?.verdict
  const majRevue = (k) => (val) => onChange({ ...p, revue: { ...p.revue, [k]: val } })
  return (
    <motion.div layout initial={{ opacity: 0, y: 10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ ...RESSORT, delay: Math.min(i, 6) * 0.03 }}
      className={`relative overflow-hidden rounded-2xl border bg-white ${v === 'non' ? 'border-craie opacity-70' : 'border-craie'}`}>
      {v && <span className={`absolute inset-y-0 left-0 w-1 ${TONS_VERDICT[v].split(' ')[0]}`} />}
      <div className="p-4 md:p-5">
        {edition ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <input className="champ h-10 font-bold" value={p.titre} placeholder="Nom de l’outil" onChange={(e) => onChange({ ...p, titre: e.target.value })} />
              <button type="button" onClick={onSupprimer} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-pierre transition hover:bg-red-600/10 hover:text-red-700" aria-label="Retirer"><Icone nom="corbeille" /></button>
            </div>
            <TexteLibre valeur={p.description} onChange={(val) => onChange({ ...p, description: val })} placeholder="Ce que l’outil fait pour eux" lignes={1} />
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_150px]">
              <input className="champ h-10" value={p.impact} placeholder="Impact attendu (ex. ne plus perdre de leads)" onChange={(e) => onChange({ ...p, impact: e.target.value })} />
              <div className="relative"><input className="champ h-10 pr-20" inputMode="numeric" value={p.jours} onChange={(e) => onChange({ ...p, jours: e.target.value })} /><span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-pierre">jours est.</span></div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="font-extrabold">{p.titre}</div>
              {p.description && <p className="mt-0.5 text-sm text-pierre">{p.description}</p>}
              {p.impact && <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-encre/80"><Icone nom="eclair" className="h-3.5 w-3.5 text-accent" /> {p.impact}</p>}
            </div>
            <div className="text-right text-xs text-pierre">
              {v && !revue && <div className="mb-1"><Pastille ton={v === 'ok' ? 'vert' : v === 'reserve' ? 'ambre' : 'alerte'}>{W.VERDICTS.find((x) => x.id === v).label}</Pastille></div>}
              {(p.revue?.jours || p.jours) ? <span className="tabular">{p.revue?.jours || p.jours} j{p.revue?.jours ? '' : ' (estimé)'}</span> : null}
            </div>
          </div>
        )}

        {/* Revue technique de Martin */}
        {revue && (
          <div className="mt-4 border-t border-dashed border-craie pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1 rounded-full bg-papier p-1">
                {W.VERDICTS.map((x) => (
                  <button key={x.id} type="button" onClick={() => majRevue('verdict')(x.id)} className={`relative rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${v === x.id ? 'text-white' : 'text-pierre hover:text-encre'}`}>
                    {v === x.id && <motion.span layoutId={`verdict-${p.id}`} transition={RESSORT} className={`absolute inset-0 rounded-full ${TONS_VERDICT[x.id]}`} />}
                    <span className="relative">{x.label}</span>
                  </button>
                ))}
              </div>
              {v !== 'non' && (
                <div className="relative w-36"><input className="champ h-9 pr-14 text-sm" inputMode="numeric" placeholder={String(p.jours || '')} value={p.revue?.jours ?? ''} onChange={(e) => majRevue('jours')(e.target.value)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pierre">jours</span></div>
              )}
            </div>
            <input className="champ mt-2.5 h-9 text-sm" placeholder={v === 'non' ? 'Pourquoi ce n’est pas faisable ?' : 'Commentaire technique (facultatif)'} value={p.revue?.commentaire || ''} onChange={(e) => majRevue('commentaire')(e.target.value)} />
          </div>
        )}
        {!revue && p.revue?.commentaire && <p className="mt-3 rounded-xl bg-papier px-3 py-2 font-serif text-[14px] italic text-pierre">Martin : « {p.revue.commentaire} »</p>}
      </div>
    </motion.div>
  )
}

export default function OngletAudit({ d, moi, aller }) {
  const { modifier } = useStore()
  const a = d.audit
  if (!a) return null
  const edition = d.etape === 'audit' && !d.perdu
  const revue = d.etape === 'revue' && moi.role === 'dev' && !d.perdu
  const c = W.completionAudit(a)
  const maj = (section, k) => (v) => modifier(d.id, (x) => ({ ...x, audit: { ...x.audit, [section]: { ...x.audit[section], [k]: v } } }))
  const majProps = (fn) => modifier(d.id, (x) => ({ ...x, audit: { ...x.audit, propositions: fn(x.audit.propositions) } }))
  const ajouter = (modele) => majProps((ps) => [...ps, { id: uid('p'), titre: modele?.titre || '', description: modele?.description || '', impact: '', jours: modele?.jours || '', revue: {} }])
  const dejaLa = new Set(a.propositions.map((p) => p.titre))
  const verdicts = a.propositions.filter((p) => p.revue?.verdict).length
  const retenues = a.propositions.filter((p) => p.revue?.verdict && p.revue.verdict !== 'non')
  const estimation = retenues.reduce((s, p) => s + (Number(p.revue.jours) || Number(p.jours) || 0), 0)
  const dernierRetour = a.retours[0]
  const retourOuvert = edition && dernierRetour && (!a.soumisLe || dernierRetour.date > a.soumisLe)

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

      {/* Avancement de l'audit */}
      <div className="carte flex flex-wrap items-center gap-x-6 gap-y-3 p-4 md:px-5">
        <div className="w-full sm:w-44"><Progression faits={c.faits} total={c.total} couleur={c.faits === c.total ? 'bg-vert' : 'bg-accent'} /></div>
        <div className="sans-barre flex flex-1 gap-1.5 overflow-x-auto">
          {W.SECTIONS_AUDIT.map((s) => (
            <a key={s.id} href={`#/dossier/${d.id}/audit`} onClick={(e) => { e.preventDefault(); document.getElementById(`audit-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }) }}
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold transition ${c.sections[s.id] ? 'bg-vert/10 text-vert' : 'bg-papier text-pierre hover:text-encre'}`}>
              {c.sections[s.id] && <Icone nom="coche" className="h-3 w-3" epaisseur={3} />}{s.label}
            </a>
          ))}
        </div>
        {edition && <Champ label="Call d’audit" className="w-full sm:w-44"><input type="date" className="champ h-9 text-sm" value={a.callLe || ''} onChange={(e) => modifier(d.id, (x) => ({ ...x, audit: { ...x.audit, callLe: e.target.value } }))} /></Champ>}
      </div>

      <Section id="business" numero={1} titre="Business" fait={c.sections.business}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Champ label="Offre principale"><Saisie edition={edition} valeur={a.business.offre} onChange={maj('business', 'offre')} placeholder="Ex. Formation trading 12 semaines" /></Champ>
          <Champ label="Prix"><Saisie edition={edition} valeur={a.business.prix} onChange={maj('business', 'prix')} placeholder="Ex. 2 497 €" /></Champ>
          <Champ label="CA mensuel"><Saisie edition={edition} valeur={a.business.caMensuel} onChange={maj('business', 'caMensuel')} suffixe="k€" placeholder="150" /></Champ>
          <Champ label="Ventes par mois"><Saisie edition={edition} valeur={a.business.ventesMois} onChange={maj('business', 'ventesMois')} placeholder="60" /></Champ>
        </div>
        <div className="mt-4">
          <span className="etiquette">Acquisition</span>
          {edition ? <Puces options={CANAUX} valeur={a.business.acquisition} onChange={maj('business', 'acquisition')} /> : <div className="flex flex-wrap gap-1.5">{a.business.acquisition.length ? a.business.acquisition.map((x) => <Pastille key={x}>{x}</Pastille>) : <span className="text-pierre/60">—</span>}</div>}
        </div>
      </Section>

      <Section id="equipe" numero={2} titre="Équipe" fait={c.sections.equipe} note={`${a.equipe.setters + a.equipe.closers + a.equipe.managers + a.equipe.support} personnes`}>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[['setters', 'Setters'], ['closers', 'Closers'], ['managers', 'Managers / head of sales'], ['support', 'Support / ops']].map(([k, label]) => edition
            ? <PlusMoins key={k} label={label} valeur={a.equipe[k]} onChange={maj('equipe', k)} />
            : <div key={k} className="flex items-center justify-between rounded-2xl bg-papier/70 px-4 py-3"><span className="text-sm font-semibold">{label}</span><span className="text-lg font-extrabold tabular">{a.equipe[k]}</span></div>)}
        </div>
        <div className="mt-4"><span className="etiquette">Organisation</span><Texte edition={edition} valeur={a.equipe.notes} onChange={maj('equipe', 'notes')} placeholder="Qui gère qui, rémunération des setters et closers, turnover…" /></div>
      </Section>

      <Section id="process" numero={3} titre="Process actuel" fait={c.sections.process} note="Du lead au client">
        <div className="relative space-y-4">
          <span className="absolute bottom-6 left-[11px] top-6 w-px bg-craie" />
          {[['acquisition', 'Acquisition', 'D’où viennent les leads ?'], ['setting', 'Setting', 'Comment les setters qualifient et posent les calls ?'], ['closing', 'Closing', 'Comment se passent les calls, le paiement ?'], ['onboarding', 'Onboarding', 'Que se passe-t-il après l’achat ?']].map(([k, label, ph], i) => (
            <div key={k} className="relative flex gap-4">
              <span className={`relative z-10 mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${a.process[k] ? 'bg-encre text-papier' : 'border border-craie bg-white text-pierre'}`}>{i + 1}</span>
              <div className="min-w-0 flex-1"><span className="etiquette">{label}</span><Texte edition={edition} valeur={a.process[k]} onChange={maj('process', k)} placeholder={ph} /></div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="outils" numero={4} titre="Outils actuels" fait={c.sections.outils}>
        {edition ? <Puces options={OUTILS} valeur={a.outils.liste} onChange={maj('outils', 'liste')} /> : <div className="flex flex-wrap gap-1.5">{a.outils.liste.length ? a.outils.liste.map((x) => <Pastille key={x} ton="plein">{x}</Pastille>) : <span className="text-pierre/60">—</span>}</div>}
        <div className="mt-4"><span className="etiquette">Autres outils, accès, abonnements</span><Texte edition={edition} valeur={a.outils.notes} onChange={maj('outils', 'notes')} placeholder="Ce qu’ils paient, ce qui marche mal, les accès qu’il nous faudra…" /></div>
      </Section>

      <Section id="chiffres" numero={5} titre="Chiffres" fait={c.sections.chiffres}>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Champ label="Leads / mois"><Saisie edition={edition} valeur={a.chiffres.leadsMois} onChange={maj('chiffres', 'leadsMois')} placeholder="2 000" /></Champ>
          <Champ label="Taux de show"><Saisie edition={edition} valeur={a.chiffres.tauxShow} onChange={maj('chiffres', 'tauxShow')} placeholder="60 %" /></Champ>
          <Champ label="Taux de closing"><Saisie edition={edition} valeur={a.chiffres.tauxClosing} onChange={maj('chiffres', 'tauxClosing')} placeholder="25 %" /></Champ>
          <Champ label="Panier moyen"><Saisie edition={edition} valeur={a.chiffres.panier} onChange={maj('chiffres', 'panier')} placeholder="2 000 €" /></Champ>
        </div>
      </Section>

      <Section id="douleurs" numero={6} titre="Problèmes" fait={c.sections.douleurs}>
        <Texte edition={edition} valeur={a.douleurs.texte} onChange={maj('douleurs', 'texte')} placeholder="Ce qui leur fait perdre du temps ou de l’argent aujourd’hui." />
        <div className="mt-4">
          <span className="etiquette">Urgence</span>
          {edition ? <Puces options={['Basse', 'Moyenne', 'Haute']} valeur={a.douleurs.urgence} onChange={maj('douleurs', 'urgence')} multiple={false} /> : <span className="text-sm font-semibold">{a.douleurs.urgence || '—'}</span>}
        </div>
      </Section>

      <Section id="propositions" numero={7} titre="Ce qu’on peut leur faire" fait={c.sections.propositions} note={revue ? `${verdicts}/${a.propositions.length} verdicts` : `${a.propositions.length} proposition${a.propositions.length > 1 ? 's' : ''}`}>
        <div className="space-y-2.5">
          <Presence initial={false}>
            {a.propositions.map((p, i) => (
              <Proposition key={p.id} p={p} i={i} edition={edition} revue={revue}
                onChange={(np) => majProps((ps) => ps.map((x) => (x.id === p.id ? np : x)))}
                onSupprimer={() => majProps((ps) => ps.filter((x) => x.id !== p.id))} />
            ))}
          </Presence>
          {a.propositions.length === 0 && !edition && <p className="font-serif italic text-pierre">Aucune proposition.</p>}
        </div>
        {edition && (
          <div className="mt-5 rounded-2xl border border-dashed border-craie p-4">
            <span className="etiquette">Ajouter depuis le catalogue</span>
            <div className="flex flex-wrap gap-1.5">
              {CATALOGUE.filter((m) => !dejaLa.has(m.titre)).map((m) => (
                <motion.button key={m.titre} type="button" whileTap={{ scale: 0.94 }} onClick={() => ajouter(m)} className="inline-flex h-8 items-center gap-1 rounded-full border border-craie bg-white px-3 text-[13px] font-semibold text-encre/80 transition hover:border-encre hover:text-encre">
                  <Icone nom="plus" className="h-3.5 w-3.5" epaisseur={2.4} /> {m.titre}
                </motion.button>
              ))}
              <motion.button type="button" whileTap={{ scale: 0.94 }} onClick={() => ajouter()} className="inline-flex h-8 items-center gap-1 rounded-full bg-encre px-3 text-[13px] font-semibold text-papier">
                <Icone nom="stylo" className="h-3.5 w-3.5" /> Sur mesure
              </motion.button>
            </div>
          </div>
        )}
      </Section>

      {/* Actions de l'étape */}
      {edition && (
        <div className="sticky bottom-24 z-20 md:bottom-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center justify-between gap-3 rounded-[22px] bg-encre px-5 py-4 text-papier shadow-[0_24px_60px_-20px_rgba(18,18,18,0.7)]">
            <div className="text-sm">
              <b>{c.faits === c.total ? 'Audit complet.' : `${c.total - c.faits} section${c.total - c.faits > 1 ? 's' : ''} à compléter.`}</b>
              <span className="text-papier/60"> Martin vérifie ensuite ce qui est faisable.</span>
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
              <b>{verdicts}/{a.propositions.length} verdicts</b>
              <span className="text-papier/60"> · {retenues.length} retenue{retenues.length > 1 ? 's' : ''}, {estimation} j ≈ {euros(estimation * TARIFS.tjm)}</span>
            </div>
            <BoutonsAction d={d} ids={['valider_audit', 'renvoyer']} taille="md" sombre aller={aller} suivre />
          </motion.div>
        </div>
      )}
      {!edition && !revue && <Surtitre className="pt-2 text-center">Audit {d.etape === 'revue' ? 'en lecture seule pendant la revue' : 'validé, en lecture seule'}</Surtitre>}
    </div>
  )
}
