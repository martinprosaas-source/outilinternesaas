import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { MEMBRES, NOM } from './config.js'
import { normaliser } from './lib.js'
import { useStore } from './store.jsx'
import { Bouton, EASE, Icone, Presence, RESSORT, Symbole, SymboleAnime, AvatarMembre } from './ui.jsx'
import { Dock, MenuCompte, MODULES, ORDRE_MODULES } from './navigation.jsx'
import Taches from './ecrans/Taches.jsx'
import Tableau from './ecrans/Tableau.jsx'
import NouveauProspect from './ecrans/NouveauProspect.jsx'
import Dossier from './dossier/Dossier.jsx'
import * as S from './suivi.js'

const ECRANS = { taches: Taches, tableau: Tableau }

// #/dossier/d12/audit → ['dossier', 'd12', 'audit']
function useRoute() {
  const lire = () => window.location.hash.replace(/^#\/?/, '')
  const [route, setRoute] = useState(lire)
  useEffect(() => {
    const f = () => setRoute((avant) => {
      const apres = lire()
      if (avant.split('/').slice(0, 2).join('/') !== apres.split('/').slice(0, 2).join('/')) window.scrollTo({ top: 0 })
      return apres
    })
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])
  const [module, param, sous] = route.split('/')
  return { module, param, sous, aller: (r) => (window.location.hash = '/' + r) }
}

const Mac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)

// ─────────────────────────── Connexion ───────────────────────────
const PHRASE = ['Du', 'premier', 'DM', 'à', 'la', 'mise', 'en', 'ligne.']

// Le cadre des écrans de connexion : panneau Encre à gauche (ordinateur), formulaire à droite.
function Cadre({ children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-encre p-12 text-papier lg:flex xl:p-16">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }} className="flex items-center gap-3">
          <Symbole className="h-9 w-9" encre="#F4F2EE" />
          <span className="text-2xl font-extrabold tracking-tight">{NOM}</span>
        </motion.div>
        <div className="relative z-10">
          <p className="max-w-lg font-serif text-[48px] italic leading-[1.06] xl:text-[60px]">
            {PHRASE.map((m, i) => (
              <span key={i} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                <motion.span className="inline-block" initial={{ y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.15 + i * 0.07 }}>
                  {m}&nbsp;
                </motion.span>
              </span>
            ))}
          </p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.8 }} className="mt-8 flex items-center gap-3 text-sm text-papier/50">
            <span className="h-px w-10 bg-papier/30" /> Prospection, audit, devis, delivery · Nino, Hugo et Martin
          </motion.p>
        </div>
        {/* Le grand chevron qui se trace en fond, et son point Cobalt. */}
        <motion.div className="pointer-events-none absolute -bottom-40 -right-32 h-[620px] w-[620px]" animate={{ rotate: [0, 4, 0] }} transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}>
          <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
            <motion.path d="M20 80 L50 20 L80 80" fill="none" stroke="#F4F2EE" strokeOpacity="0.07" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2.2, ease: EASE, delay: 0.2 }} />
            <motion.circle cx="50" cy="64" r="6" fill="#2B44E0" initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ transformOrigin: '50px 64px' }} transition={{ delay: 1.8, type: 'spring', stiffness: 400, damping: 16 }} />
          </svg>
        </motion.div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <motion.div className="w-full max-w-sm" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}>
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <SymboleAnime className="h-9 w-9" />
            <span className="text-xl font-extrabold tracking-tight">{NOM}</span>
          </div>
          {children}
        </motion.div>
      </div>
    </div>
  )
}

// Mode local (sans base) : on choisit simplement son profil.
function ConnexionLocale() {
  const { connecter } = useStore()
  return (
    <Cadre>
      <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.035em]">Qui est là ?</h1>
      <p className="mt-3 font-serif text-[17px] italic text-pierre">Chacun arrive sur ce qui l’attend.</p>
      <div className="mt-9 space-y-2">
        {MEMBRES.map((m, i) => (
          <motion.button key={m.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.06 }}
            onClick={() => connecter(m.id)} className="carte-lien group flex w-full items-center gap-3 px-4 py-3 text-left">
            <AvatarMembre id={m.id} nom={m.nom} taille="lg" plein />
            <span className="flex-1"><span className="block font-bold">{m.nom}</span><span className="block text-xs text-pierre">{m.titre}</span></span>
            <Icone nom="fleche" className="h-4 w-4 text-pierre transition group-hover:translate-x-1 group-hover:text-encre" />
          </motion.button>
        ))}
      </div>
      <p className="mt-10 text-xs leading-relaxed text-pierre">Mode démo : aucune base branchée, les données restent dans ce navigateur.</p>
    </Cadre>
  )
}

// En ligne : e-mail + mot de passe, ou création du compte (une fois par personne).
function Connexion() {
  const { seConnecter, creerCompte } = useStore()
  const [mode, setMode] = useState('connexion')
  const [email, setEmail] = useState('')
  const [mdp, setMdp] = useState('')
  const [voir, setVoir] = useState(false)
  const [etat, setEtat] = useState(null) // null | envoi | confirmer | message d'erreur
  const creation = mode === 'creation'
  const valider = async (e) => {
    e.preventDefault()
    setEtat('envoi')
    try {
      if (creation) { const aConfirmer = await creerCompte(email.trim(), mdp); setEtat(aConfirmer ? 'confirmer' : null) }
      else { await seConnecter(email.trim(), mdp) }
    } catch (err) { setEtat(err.message) }
  }
  if (etat === 'confirmer') {
    return (
      <Cadre>
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={RESSORT} className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white"><Icone nom="mail" className="h-6 w-6" /></motion.div>
        <h1 className="text-[36px] font-extrabold leading-none tracking-[-0.035em]">Regarde tes e-mails.</h1>
        <p className="mt-4 text-[15px] leading-relaxed text-pierre">On vient d’envoyer un lien de confirmation à <b className="text-encre">{email}</b>. Clique dessus, puis reviens te connecter ici.</p>
        <button onClick={() => { setEtat(null); setMode('connexion') }} className="mt-8 inline-flex items-center gap-1.5 text-sm font-bold underline-offset-4 hover:underline"><Icone nom="gauche" className="h-4 w-4" /> Revenir à la connexion</button>
      </Cadre>
    )
  }
  return (
    <Cadre>
      <div className="relative grid grid-cols-2 rounded-2xl border border-craie bg-white p-1 shadow-[0_1px_2px_rgba(18,18,18,0.04)]">
        {[{ id: 'connexion', label: 'Se connecter' }, { id: 'creation', label: 'Créer mon compte' }].map((o) => (
          <button key={o.id} type="button" onClick={() => { setMode(o.id); setEtat(null) }} className={`relative flex h-11 items-center justify-center rounded-xl text-sm font-bold transition-colors ${mode === o.id ? 'text-papier' : 'text-pierre hover:text-encre'}`}>
            {mode === o.id && <motion.span layoutId="mode-connexion" transition={RESSORT} className="absolute inset-0 rounded-xl bg-encre" />}
            <span className="relative">{o.label}</span>
          </button>
        ))}
      </div>
      <Presence mode="wait" initial={false}>
        <motion.div key={mode} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25, ease: EASE }} className="mt-9">
          <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.035em]">{creation ? 'Bienvenue.' : 'Connexion'}</h1>
          <p className="mt-3 font-serif text-[17px] italic text-pierre">{creation ? 'Crée ton accès une fois, puis choisis ta place dans l’équipe.' : 'Chacun arrive sur ce qui l’attend.'}</p>
        </motion.div>
      </Presence>
      <form onSubmit={valider} className="mt-8 space-y-4">
        <label className="block">
          <span className="etiquette">E-mail</span>
          <input type="email" required autoFocus autoComplete="username" className="champ h-12" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="etiquette">Mot de passe{creation ? ' (6 caractères minimum)' : ''}</span>
          <div className="relative">
            <input type={voir ? 'text' : 'password'} required minLength={6} autoComplete={creation ? 'new-password' : 'current-password'} className="champ h-12 pr-20" value={mdp} onChange={(e) => setMdp(e.target.value)} />
            <button type="button" onClick={() => setVoir(!voir)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-pierre hover:text-encre">{voir ? 'Masquer' : 'Afficher'}</button>
          </div>
        </label>
        <motion.button whileTap={{ scale: 0.98 }} type="submit" disabled={etat === 'envoi'}
          className="group flex h-12 w-full items-center justify-center gap-2 rounded-full bg-accent font-semibold text-white shadow-[0_12px_28px_-12px_rgba(43,68,224,0.8)] transition-colors hover:bg-[#2237c4] disabled:opacity-60">
          {etat === 'envoi' ? (creation ? 'Création…' : 'Connexion…') : <>{creation ? 'Créer mon compte' : 'Se connecter'} <Icone nom="fleche" className="h-4 w-4 transition-transform group-hover:translate-x-1" epaisseur={2.2} /></>}
        </motion.button>
        <Presence>
          {etat && etat !== 'envoi' && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-xl bg-[#FDE0DD] px-3.5 py-2.5 text-sm text-[#8A1C12]">{etat}</motion.p>}
        </Presence>
      </form>
      <p className="mt-10 text-xs leading-relaxed text-pierre">Accès réservé à Nino, Hugo et Martin. Mot de passe oublié : demande à Martin.</p>
    </Cadre>
  )
}

// Première connexion : chacun prend sa place (une seule fois).
function ChoixPlace() {
  const { placesLibres, rejoindre, deconnecter, email } = useStore()
  const [libres, setLibres] = useState(null)
  const [etat, setEtat] = useState(null)
  useEffect(() => { placesLibres().then(setLibres).catch((e) => { setLibres([]); setEtat(e.message) }) }, [placesLibres])
  const choisir = async (id) => { setEtat('envoi'); try { await rejoindre(id) } catch (e) { setEtat(e.message); placesLibres().then(setLibres).catch(() => {}) } }
  return (
    <Cadre>
      <h1 className="text-[40px] font-extrabold leading-none tracking-[-0.035em]">Qui es-tu ?</h1>
      <p className="mt-3 font-serif text-[17px] italic text-pierre">À faire une seule fois : ton compte est relié à ta place dans l’équipe.</p>
      <div className="mt-9 space-y-2">
        {MEMBRES.map((m, i) => {
          const libre = libres?.includes(m.id)
          return (
            <motion.button key={m.id} disabled={!libre || etat === 'envoi'} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.06 }}
              onClick={() => choisir(m.id)} className="carte-lien group flex w-full items-center gap-3 px-4 py-3 text-left disabled:pointer-events-none disabled:opacity-45">
              <AvatarMembre id={m.id} nom={m.nom} taille="lg" plein />
              <span className="flex-1"><span className="block font-bold">{m.nom}</span><span className="block text-xs text-pierre">{libres === null ? '…' : libre ? m.titre : 'Place déjà prise'}</span></span>
              {libre && <Icone nom="fleche" className="h-4 w-4 text-pierre transition group-hover:translate-x-1 group-hover:text-encre" />}
            </motion.button>
          )
        })}
      </div>
      {etat && etat !== 'envoi' && <p className="mt-4 rounded-xl bg-[#FDE0DD] px-3.5 py-2.5 text-sm text-[#8A1C12]">{etat}</p>}
      <p className="mt-10 text-xs leading-relaxed text-pierre">Connecté en tant que <b className="text-encre">{email}</b>. <button onClick={deconnecter} className="font-semibold underline-offset-4 hover:underline">Se déconnecter</button></p>
    </Cadre>
  )
}

function Attente({ texte }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5">
      <SymboleAnime className="h-14 w-14" boucle />
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="font-serif text-[15px] italic text-pierre">{texte}</motion.p>
    </div>
  )
}

// ─────────────────────────── Messages (erreur / confirmation) ───────────────────────────
function Messages() {
  const { erreur, effacerErreur, toast } = useStore()
  useEffect(() => {
    if (!erreur) return
    const t = setTimeout(effacerErreur, 5000)
    return () => clearTimeout(t)
  }, [erreur]) // eslint-disable-line react-hooks/exhaustive-deps
  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-28 z-[90] flex flex-col items-center gap-2 md:bottom-8">
      <Presence>
        {erreur && (
          <motion.div key="e" initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={RESSORT}
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl bg-encre px-4 py-3 text-sm text-papier shadow-2xl">
            <Icone nom="attention" className="mt-0.5 h-4 w-4 shrink-0 text-[#8EA0FF]" />
            <span className="flex-1">{erreur}</span>
            <button onClick={effacerErreur} className="font-semibold text-papier/60 hover:text-papier">OK</button>
          </motion.div>
        )}
        {toast && (
          <motion.div key={toast.id} initial={{ opacity: 0, y: 24, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={RESSORT}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full bg-encre py-2.5 pl-2.5 pr-5 text-sm font-semibold text-papier shadow-2xl">
            <motion.span initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }} className="flex h-6 w-6 items-center justify-center rounded-full bg-accent">
              <Icone nom="coche" className="h-3.5 w-3.5 text-white" epaisseur={2.8} />
            </motion.span>
            {toast.texte}
          </motion.div>
        )}
      </Presence>
    </div>,
    document.body,
  )
}

// ─────────────────────────── Palette de commandes (⌘K) ───────────────────────────
function Palette({ onFermer, aller, courant }) {
  const { data } = useStore()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const liste = useRef(null)
  const entrees = useMemo(() => {
    const e = ORDRE_MODULES.map((id) => ({ groupe: 'Aller à', icone: id, titre: MODULES[id].label, route: id }))
    e.push({ groupe: 'Actions', icone: 'plus', titre: 'Nouveau prospect', route: `${courant}/nouveau` })
    data.dossiers.forEach((d) => e.push({ groupe: 'Dossiers', icone: S.phase(d).icone, titre: d.business || d.nom, detail: `${d.nom} · ${S.phase(d).label} · ${S.etatTexte(d)}`, route: `dossier/${d.id}` }))
    return e
  }, [data, courant])
  const resultats = useMemo(() => {
    const m = normaliser(q.trim())
    return (m ? entrees.filter((x) => normaliser(`${x.titre} ${x.detail} ${x.groupe}`).includes(m)) : entrees).slice(0, 40)
  }, [q, entrees])
  useEffect(() => setSel(0), [q])
  useEffect(() => { liste.current?.querySelector(`[data-i="${sel}"]`)?.scrollIntoView({ block: 'nearest' }) }, [sel])
  const choisir = (x) => { onFermer(); aller(x.route) }
  const clavier = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(resultats.length - 1, s + 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)) }
    if (e.key === 'Enter' && resultats[sel]) choisir(resultats[sel])
    if (e.key === 'Escape') onFermer()
  }
  let groupe = null
  return createPortal(
    <motion.div className="fixed inset-0 z-[80] flex items-start justify-center bg-encre/30 px-4 pt-[12vh] backdrop-blur-[4px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onMouseDown={onFermer}>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={RESSORT}
        className="w-full max-w-xl overflow-hidden rounded-[24px] border border-craie bg-papier shadow-[0_40px_120px_-30px_rgba(18,18,18,0.6)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-craie px-5">
          <Icone nom="recherche" className="h-5 w-5 text-pierre" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={clavier} placeholder="Rechercher un dossier, une page…" className="h-16 flex-1 bg-transparent text-[17px] placeholder:text-pierre/60 focus:outline-none" />
          <kbd className="rounded-md border border-craie bg-white px-1.5 py-0.5 text-[11px] font-semibold text-pierre">Échap</kbd>
        </div>
        <div ref={liste} className="max-h-[52vh] overflow-y-auto p-2">
          {resultats.length === 0 && <p className="px-3 py-10 text-center font-serif italic text-pierre">Rien ne correspond à « {q} ».</p>}
          {resultats.map((x, i) => {
            const titreGroupe = x.groupe !== groupe ? (groupe = x.groupe) : null
            return (
              <div key={`${x.route}-${i}`}>
                {titreGroupe && <div className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-pierre">{titreGroupe}</div>}
                <button data-i={i} onMouseMove={() => setSel(i)} onClick={() => choisir(x)} className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${sel === i ? 'text-papier' : ''}`}>
                  {sel === i && <motion.span layoutId="palette-sel" transition={{ type: 'spring', stiffness: 600, damping: 45 }} className="absolute inset-0 rounded-xl bg-encre" />}
                  <span className={`relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${sel === i ? 'bg-white/10' : 'bg-white'}`}><Icone nom={x.icone} className="h-4 w-4" /></span>
                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{x.titre}</span>
                    {x.detail && <span className={`block truncate text-xs ${sel === i ? 'text-papier/60' : 'text-pierre'}`}>{x.detail}</span>}
                  </span>
                  {sel === i && <Icone nom="entree" className="relative h-4 w-4 text-papier/60" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-craie bg-white/60 px-5 py-2.5 text-[11px] text-pierre">
          <span><kbd className="font-semibold">↑↓</kbd> naviguer</span>
          <span><kbd className="font-semibold">Entrée</kbd> ouvrir</span>
          <span className="ml-auto flex items-center gap-1.5"><Symbole className="h-3.5 w-3.5" /> {NOM}</span>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

// ─────────────────────────── Application ───────────────────────────
export default function App() {
  const { moi, data, deconnecter, reinitialiser, etat, enLigne, email, sauvegarde } = useStore()
  const { module, param, sous, aller } = useRoute()
  const [palette, setPalette] = useState(false)
  const [defile, setDefile] = useState(false)

  useEffect(() => {
    const f = () => setDefile(window.scrollY > 12)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])
  useEffect(() => {
    const f = (e) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p) } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  const b = useMemo(() => (moi ? { taches: S.mesTaches(data.dossiers, moi.id).length } : {}), [data.dossiers, moi])
  if (etat === 'verification' || etat === 'chargement') return <Attente texte={etat === 'chargement' ? 'Chargement des dossiers…' : 'Connexion…'} />
  if (etat === 'deconnecte') return <><Connexion /><Messages /></>
  if (etat === 'sansPlace') return <><ChoixPlace /><Messages /></>
  if (!moi) return <><ConnexionLocale /><Messages /></>

  const dossier = module === 'dossier' ? data.dossiers.find((d) => d.id === param) : null
  const courant = dossier ? 'tableau' : ECRANS[module] ? module : 'taches'
  const Ecran = ECRANS[courant]
  const nouveau = !dossier && param === 'nouveau'
  const cle = dossier ? `dossier/${dossier.id}` : courant

  return (
    <div className="min-h-screen">
      <div className="grain" aria-hidden="true" />
      <header className={`sticky top-0 z-40 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${defile ? 'bg-papier/80 shadow-[0_1px_0_rgba(230,226,218,0.9)] backdrop-blur-xl' : ''}`}>
        <div className={`mx-auto flex max-w-[1320px] items-center justify-between gap-4 px-4 transition-[padding] duration-300 md:px-8 ${defile ? 'py-2.5' : 'py-4 md:py-5'}`}>
          <a href="#/taches" className="group flex items-center gap-2.5">
            <motion.span whileHover={{ rotate: -8, scale: 1.06 }} transition={RESSORT} className="inline-flex">
              <SymboleAnime className="h-8 w-8" />
            </motion.span>
            <span className="text-[19px] font-extrabold tracking-tight">{NOM}</span>
          </a>
          <div className="hidden md:block"><Dock courant={courant} badges={b} /></div>
          <div className="flex items-center gap-2">
            <Bouton taille="md" icone="plus" className="!px-3 lg:!px-4" onClick={() => aller(`${courant}/nouveau`)} aria-label="Nouveau prospect"><span className="hidden lg:inline">Prospect</span></Bouton>
            <motion.button whileTap={{ scale: 0.94 }} onClick={() => setPalette(true)} className="flex h-10 items-center gap-2 rounded-full border border-craie bg-white px-3 text-sm text-pierre shadow-[0_1px_2px_rgba(18,18,18,0.04)] transition hover:border-encre/30 hover:text-encre" aria-label="Rechercher">
              <Icone nom="recherche" className="h-4 w-4" />
              <kbd className="hidden rounded-md bg-papier px-1.5 text-[11px] font-semibold lg:inline">{Mac ? '⌘' : 'Ctrl'} K</kbd>
            </motion.button>
            <MenuCompte moi={moi} email={email} enLigne={enLigne} sauvegarde={sauvegarde} onChanger={deconnecter} onReinitialiser={reinitialiser} />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1320px] px-4 pb-36 pt-4 md:px-8 md:pb-24 md:pt-8">
        <Presence mode="wait" initial={false}>
          <motion.div key={cle} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35, ease: EASE }}>
            {dossier ? <Dossier id={dossier.id} onglet={sous} aller={aller} /> : <Ecran aller={aller} />}
          </motion.div>
        </Presence>
      </main>

      <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 md:hidden">
        <Dock courant={courant} mobile badges={b} />
      </div>

      <Presence>{palette && <Palette onFermer={() => setPalette(false)} aller={aller} courant={courant} />}</Presence>
      <Presence>{nouveau && <NouveauProspect onFermer={() => aller(courant)} aller={aller} />}</Presence>
      <Messages />
    </div>
  )
}
