// Ce que Hugo rend à Martin, en 5 parties : de quoi rendre un verdict, compter les jours et faire le devis sans rappeler le client.
// En revue, Martin donne ici son verdict sur chaque besoin.
import { motion } from 'motion/react'
import { dateCourte } from '../lib.js'
import { EASE, Icone, Pastille, RESSORT, Surtitre } from '../ui.jsx'
import { BLOCS, ENTRETIENS, PRIORITES, SUJETS_DECISION, itemDe } from '../trame.js'
import * as W from '../workflow.js'

const TONS_VERDICT = { ok: 'bg-vert', reserve: 'bg-ambre', non: 'bg-red-700' }
const TON_PASTILLE = { ok: 'vert', reserve: 'ambre', non: 'alerte' }

const Manque = ({ children = 'à demander' }) => <span className="font-serif text-[15px] italic text-ambre">{children}</span>

function Partie({ n, titre, note, children }) {
  return (
    <motion.section initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '0px 0px -40px 0px' }} transition={{ duration: 0.55, ease: EASE }} className="carte p-5 md:p-6">
      <div className="mb-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-[22px] italic leading-none text-pierre">{n}.</span>
        <h3 className="text-[18px] font-extrabold tracking-tight">{titre}</h3>
        {note && <span className="ml-auto text-[13px] text-pierre">{note}</span>}
      </div>
      {children}
    </motion.section>
  )
}

// Un tableau en lecture : en-têtes sur ordinateur, fiches empilées sur téléphone.
function Table({ colonnes, lignes, gabarit, vide = 'Rien de noté.' }) {
  if (!lignes.length) return <p className="font-serif text-[15px] italic text-pierre">{vide}</p>
  return (
    <div className="overflow-hidden rounded-2xl border border-craie">
      <div className="hidden gap-3 bg-papier/70 px-4 py-2 md:grid" style={{ gridTemplateColumns: gabarit }}>
        {colonnes.map((c) => <span key={c.k} className="text-[11px] font-semibold uppercase tracking-[0.1em] text-pierre">{c.label}</span>)}
      </div>
      {lignes.map((l, i) => (
        <div key={l.id || i} className="grid grid-cols-1 gap-1 border-t border-craie px-4 py-3 first:border-t-0 md:gap-3 md:[grid-template-columns:var(--g)] md:first:border-t" style={{ '--g': gabarit }}>
          {colonnes.map((c) => {
            const v = c.rendu ? c.rendu(l, i) : l[c.k]
            return (
              <div key={c.k} className="min-w-0 text-[14px] leading-snug">
                <span className="mr-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-pierre md:hidden">{c.label}</span>
                {v || <span className="text-pierre/50">—</span>}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function Cle({ label, valeur, manque = 'à demander' }) {
  return (
    <div className="rounded-2xl bg-papier/70 px-4 py-3">
      <Surtitre>{label}</Surtitre>
      <div className="mt-1 text-[16px] font-extrabold leading-snug tracking-tight">{valeur || <Manque>{manque}</Manque>}</div>
    </div>
  )
}

function Verdict({ b, onVerdict }) {
  const v = b.revue?.verdict
  return (
    <div className="mt-3 border-t border-dashed border-craie pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full bg-papier p-1">
          {W.VERDICTS.map((x) => (
            <button key={x.id} type="button" onClick={() => onVerdict(b.id, { verdict: x.id })} className={`relative rounded-full px-3 py-1.5 text-[12.5px] font-bold transition-colors ${v === x.id ? 'text-white' : 'text-pierre hover:text-encre'}`}>
              {v === x.id && <motion.span layoutId={`verdict-${b.id}`} transition={RESSORT} className={`absolute inset-0 rounded-full ${TONS_VERDICT[x.id]}`} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
        {v && v !== 'non' && (
          <div className="relative w-32"><input className="champ h-9 pr-14 text-sm" inputMode="decimal" placeholder="0" value={b.revue?.jours ?? ''} onChange={(e) => onVerdict(b.id, { jours: e.target.value })} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-pierre">jours</span></div>
        )}
      </div>
      <input className="champ mt-2 h-9 text-sm" placeholder={v === 'non' ? 'Pourquoi ce n’est pas faisable ?' : v === 'reserve' ? 'Quelle réserve ? (accès, API, dépendance…)' : 'Commentaire technique (facultatif)'} value={b.revue?.commentaire || ''} onChange={(e) => onVerdict(b.id, { commentaire: e.target.value })} />
    </div>
  )
}

function Besoin({ b, n, revue, onVerdict }) {
  const v = b.revue?.verdict
  const chiffrable = b.priorite !== 'hors'
  return (
    <motion.div layout transition={RESSORT} className={`relative overflow-hidden rounded-2xl border border-craie bg-white p-4 ${v === 'non' || b.priorite === 'hors' ? 'opacity-75' : ''}`}>
      {v && <span className={`absolute inset-y-0 left-0 w-1 ${TONS_VERDICT[v]}`} />}
      <div className="flex gap-3">
        <span className="mt-0.5 w-6 shrink-0 text-[13px] font-bold tabular text-pierre">{n}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] leading-snug">
            <b>{b.qui || 'Quelqu’un'}</b> a besoin de <b>{b.besoin || '…'}</b>{b.pour ? <> pour <span className="font-serif text-[16px] italic">{b.pour}</span></> : ''}.
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-pierre">
            <span className="inline-flex items-center gap-1"><Icone nom="doc" className="h-3.5 w-3.5" /> {b.preuve || <Manque>preuve manquante</Manque>}</span>
            {!revue && v && <Pastille ton={TON_PASTILLE[v]}>{W.VERDICTS.find((x) => x.id === v).label}{b.revue?.jours && v !== 'non' ? ` · ${b.revue.jours} j` : ''}</Pastille>}
          </div>
          {!revue && b.revue?.commentaire && <p className="mt-2 rounded-xl bg-papier px-3 py-2 font-serif text-[14px] italic text-pierre">Martin : « {b.revue.commentaire} »</p>}
          {revue && chiffrable && <Verdict b={b} onVerdict={onVerdict} />}
        </div>
      </div>
    </motion.div>
  )
}

export default function LivrableAudit({ a, revue = false, onVerdict }) {
  const f = a.fiche
  const num = new Map(a.besoins.map((b, i) => [b.id, i + 1]))
  const ouvertes = W.questionsOuvertes(a)
  const repondues = a.questions.filter((q) => q.reponse?.trim())
  const notes = BLOCS.map((b, i) => ({ b, i, texte: a.notes?.[b.id]?.trim(), pieces: a.pieces.filter((p) => p.bloc === b.id) })).filter((x) => x.texte || x.pieces.length)
  const entretiens = ENTRETIENS.filter((e) => a.entretiens?.[e.id])

  return (
    <div className="space-y-4">
      <Partie n={1} titre="La fiche du client" note={entretiens.length ? `Entretiens : ${entretiens.map((e) => e.label.toLowerCase()).join(', ')}` : 'Aucun entretien noté'}>
        <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Cle label="Budget envisagé" valeur={f.budget} />
          <Cle label="Valide le devis et paie" valeur={f.decideurDevis} />
          <Cle label="Lancement souhaité" valeur={f.lancement} />
          <Cle label="Les chiffres partent du" valeur={f.dateDepart && dateCourte(f.dateDepart)} />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
          {[['leads', 'Leads / mois'], ['rdv', 'Rendez-vous / mois'], ['ventes', 'Ventes / mois'], ['ca', 'CA mensuel']].map(([k, label]) => (
            <div key={k} className="rounded-2xl border border-craie px-4 py-3">
              <div className="text-[12px] text-pierre">{label}</div>
              <div className="mt-0.5 text-[22px] font-extrabold tracking-tight tabular">{f.volumes[k] || <span className="text-pierre/40">—</span>}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <span className="etiquette">Les offres</span>
            <Table gabarit="1.4fr 0.6fr 1.4fr" lignes={f.offres} colonnes={[{ k: 'offre', label: 'Offre' }, { k: 'prix', label: 'Prix' }, { k: 'paiement', label: 'Options de paiement' }]} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_1.4fr]">
            <div>
              <span className="etiquette">Sources de leads</span>
              <div className="flex flex-wrap gap-1.5">{f.sources.length ? f.sources.map((s) => <Pastille key={s}>{s}</Pastille>) : <Manque />}</div>
            </div>
            <div>
              <span className="etiquette">Le tunnel</span>
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed">{f.tunnel || <Manque />}</p>
            </div>
          </div>
          <div>
            <span className="etiquette">L’équipe · {f.equipe.length} personne{f.equipe.length > 1 ? 's' : ''}</span>
            <Table gabarit="1fr 1fr 1fr 0.8fr 0.8fr" lignes={f.equipe} colonnes={[{ k: 'prenom', label: 'Prénom' }, { k: 'role', label: 'Rôle' }, { k: 'pays', label: 'Pays / fuseau' }, { k: 'langue', label: 'Langue' }, { k: 'appareil', label: 'Appareil' }]} />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <span className="etiquette">Accès extérieurs</span>
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed">{f.externes || <span className="text-pierre">Aucun</span>}</p>
            </div>
            <div>
              <span className="etiquette">Qui tranche ?</span>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px]">
                {SUJETS_DECISION.map((s) => <div key={s.id}><span className="text-pierre">{s.label} · </span>{f.decideurs[s.id] ? <b>{f.decideurs[s.id]}</b> : <Manque>?</Manque>}</div>)}
              </div>
            </div>
          </div>
        </div>
      </Partie>

      <Partie n={2} titre="La liste des besoins" note={`${a.besoins.length} besoin${a.besoins.length > 1 ? 's' : ''}`}>
        <div className="space-y-5">
          {PRIORITES.map((p) => {
            const liste = a.besoins.filter((b) => (b.priorite || 'indispensable') === p.id)
            if (!liste.length) return null
            return (
              <div key={p.id}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${p.id === 'indispensable' ? 'bg-accent' : p.id === 'plus_tard' ? 'bg-ambre' : 'bg-pierre/50'}`} />
                  <span className="text-[13px] font-bold">{p.label}</span>
                  <span className="text-[12px] text-pierre">· {liste.length}</span>
                  {revue && p.id === 'plus_tard' && <span className="text-[12px] text-pierre">· verdict facultatif, hors devis</span>}
                </div>
                <div className="space-y-2">{liste.map((b) => <Besoin key={b.id} b={b} n={num.get(b.id)} revue={revue} onVerdict={onVerdict} />)}</div>
              </div>
            )
          })}
          {!a.besoins.length && <p className="font-serif text-[15px] italic text-pierre">Aucun besoin pour l’instant.</p>}
        </div>
      </Partie>

      <Partie n={3} titre="Les règles d’argent" note={`${a.regles.length} règle${a.regles.length > 1 ? 's' : ''}`}>
        {a.regles.length ? (
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {a.regles.map((r) => (
              <div key={r.id} className="rounded-2xl border border-craie p-4">
                <div className="text-[15px] font-bold leading-snug">{r.regle || '…'}</div>
                <p className="mt-1.5 font-serif text-[15px] italic leading-snug text-encre/80">{r.exemple || <Manque>exemple chiffré manquant</Manque>}</p>
                <div className="mt-2 text-[12.5px] text-pierre">Validée par {r.validePar ? <b className="text-encre">{r.validePar}</b> : <Manque>?</Manque>}</div>
              </div>
            ))}
          </div>
        ) : <p className="font-serif text-[15px] italic text-pierre">Aucune règle notée.</p>}
      </Partie>

      <Partie n={4} titre="Les critères de recette" note={<>Validés côté client par {f.valideurRecette ? <b className="text-encre">{f.valideurRecette}</b> : <Manque>?</Manque>}</>}>
        {a.recette.length ? (
          <ul className="space-y-1.5">
            {a.recette.map((c) => <li key={c.id} className="flex gap-2.5 text-[14.5px]"><Icone nom="coche" className="mt-0.5 h-4 w-4 shrink-0 text-vert" epaisseur={2.4} />{c.texte}</li>)}
          </ul>
        ) : <p className="font-serif text-[15px] italic text-pierre">Aucun critère noté.</p>}
        {f.exclus && <div className="mt-5 rounded-2xl bg-papier/70 p-4"><Surtitre>Explicitement exclu</Surtitre><p className="mt-1 whitespace-pre-line text-[14.5px]">{f.exclus}</p></div>}
      </Partie>

      <Partie n={5} titre="Les accès et les questions ouvertes" note={ouvertes.length ? <span className="font-bold text-ambre">{ouvertes.length} sans réponse</span> : 'Tout a une réponse'}>
        <Table gabarit="1fr 0.8fr 0.6fr 0.9fr 1fr 0.7fr" lignes={a.acces} vide="Aucun outil noté."
          colonnes={[{ k: 'outil', label: 'Outil' }, { k: 'abonnement', label: 'Abonnement' }, { k: 'api', label: 'API' }, { k: 'admin', label: 'Admin' }, { k: 'cles', label: 'Donne les clés' }, { k: 'quand', label: 'Quand' }]} />
        <div className="mt-6 space-y-2">
          {ouvertes.map((q) => {
            const it = itemDe(q.item)
            return (
              <div key={q.id} className="flex gap-3 rounded-2xl border border-ambre/30 bg-ambre/[0.05] px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ambre text-[11px] font-extrabold text-white">?</span>
                <div className="min-w-0 flex-1 text-[14.5px] leading-snug">
                  {q.texte || '…'}
                  <div className="mt-1 text-[12.5px] text-pierre">{it ? `Bloc ${it.numero} · ${it.bloc.court} · ` : ''}À demander à {q.aQui ? <b className="text-encre">{q.aQui}</b> : <Manque>?</Manque>}</div>
                </div>
              </div>
            )
          })}
          {repondues.map((q) => (
            <div key={q.id} className="flex gap-3 rounded-2xl border border-craie px-4 py-3">
              <Icone nom="coche" className="mt-0.5 h-5 w-5 shrink-0 text-vert" epaisseur={2.4} />
              <div className="min-w-0 flex-1 text-[14.5px] leading-snug"><span className="text-pierre">{q.texte}</span><div className="mt-0.5 font-semibold">{q.reponse}</div></div>
            </div>
          ))}
        </div>
      </Partie>

      {notes.length > 0 && (
        <section className="carte p-5 md:p-6">
          <Surtitre>Annexes · notes et pièces par bloc</Surtitre>
          <div className="mt-4 divide-y divide-craie">
            {notes.map(({ b, i, texte, pieces }) => (
              <div key={b.id} className="grid grid-cols-1 gap-2 py-3.5 first:pt-0 last:pb-0 md:grid-cols-[180px_1fr]">
                <div className="text-[13px] font-bold"><span className="text-pierre">{i + 1}.</span> {b.titre}</div>
                <div>
                  {texte && <p className="whitespace-pre-line text-[14px] leading-relaxed">{texte}</p>}
                  {pieces.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {pieces.map((p) => p.lien
                        ? <a key={p.id} href={p.lien} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full border border-craie px-2.5 py-1 text-[12.5px] font-semibold hover:border-encre"><Icone nom="lien" className="h-3.5 w-3.5" /> {p.nom || 'Pièce'}</a>
                        : <span key={p.id} className="inline-flex items-center gap-1 rounded-full bg-papier px-2.5 py-1 text-[12.5px] font-semibold"><Icone nom="doc" className="h-3.5 w-3.5" /> {p.nom || 'Pièce'}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
