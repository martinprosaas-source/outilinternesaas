import { useEffect, useRef, useState } from 'react'
import { LayoutGroup, motion } from 'motion/react'
import { AvatarMembre, EASE, Icone, Presence, RESSORT } from './ui.jsx'

// Deux écrans seulement : ce que j'ai à faire, et le tableau de toute l'équipe.
export const MODULES = {
  taches: { label: 'Mes tâches', court: 'Mes tâches' },
  tableau: { label: 'Tableau', court: 'Tableau' },
}
export const ORDRE_MODULES = Object.keys(MODULES)

// Le dock : une pilule Encre. Seul l'onglet actif s'ouvre et montre son nom ; il glisse d'un module à l'autre.
// Un point Cobalt signale les dossiers qui attendent mon action dans ce module.
export function Dock({ courant, mobile = false, badges = {} }) {
  return (
    <LayoutGroup id={mobile ? 'dock-mobile' : 'dock'}>
      <nav
        className={`flex items-center rounded-full bg-encre p-1.5 text-papier shadow-[0_18px_40px_-18px_rgba(18,18,18,0.75),inset_0_1px_0_rgba(255,255,255,0.06)] ${mobile ? 'gap-0.5' : 'gap-1'}`}
        aria-label="Navigation"
      >
        {ORDRE_MODULES.map((id) => {
          const actif = courant === id
          const n = badges[id] || 0
          return (
            <motion.a
              key={id}
              layout
              href={`#/${id}`}
              transition={RESSORT}
              aria-current={actif ? 'page' : undefined}
              className={`group relative flex items-center rounded-full ${mobile ? 'h-11 px-3.5' : 'h-10 px-3.5'} ${actif ? 'text-encre' : 'text-papier/55 hover:text-papier'}`}
            >
              {actif && <motion.span layoutId="dock-actif" transition={RESSORT} className="absolute inset-0 rounded-full bg-papier" />}
              <motion.span layout="position" className="relative flex items-center">
                <span className="relative">
                  <Icone nom={id} className="h-[18px] w-[18px]" epaisseur={actif ? 2.1 : 1.8} />
                  <Presence>
                    {n > 0 && (
                      <motion.span
                        initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className={`absolute -right-2 -top-1.5 flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white ring-2 ${actif ? 'ring-papier' : 'ring-encre'}`}
                      >
                        {n}
                      </motion.span>
                    )}
                  </Presence>
                </span>
                <Presence initial={false}>
                  {actif && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden whitespace-nowrap text-[13px] font-bold"
                    >
                      <span className="pl-2.5 pr-0.5">{mobile ? MODULES[id].court : MODULES[id].label}</span>
                    </motion.span>
                  )}
                </Presence>
              </motion.span>
              {!actif && !mobile && (
                <span className="pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 -translate-y-1 whitespace-nowrap rounded-lg bg-encre px-2.5 py-1 text-[11px] font-semibold text-papier opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100">
                  {MODULES[id].label}
                </span>
              )}
            </motion.a>
          )
        })}
      </nav>
    </LayoutGroup>
  )
}

// Petit point d'état de la sauvegarde (en ligne) : vert enregistré, Cobalt qui pulse pendant l'envoi, rouge en cas d'erreur.
const SAUVEGARDE = { ok: { couleur: 'bg-vert', texte: 'Tout est enregistré' }, envoi: { couleur: 'bg-accent', texte: 'Enregistrement…' }, erreur: { couleur: 'bg-[#E5484D]', texte: 'Échec de l’enregistrement' } }

export function MenuCompte({ moi, email, enLigne, sauvegarde = 'ok', onChanger, onReinitialiser }) {
  const [ouvert, setOuvert] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!ouvert) return
    const f = (e) => { if (!ref.current?.contains(e.target)) setOuvert(false) }
    const k = (e) => e.key === 'Escape' && setOuvert(false)
    document.addEventListener('mousedown', f)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', f); document.removeEventListener('keydown', k) }
  }, [ouvert])
  return (
    <div ref={ref} className="relative">
      <motion.button whileTap={{ scale: 0.94 }} onClick={() => setOuvert(!ouvert)} className="flex items-center gap-2 rounded-full border border-craie bg-white py-1 pl-1 pr-3 shadow-[0_1px_2px_rgba(18,18,18,0.04)] transition hover:border-encre/30" aria-label="Mon compte">
        <span className="relative">
          <AvatarMembre id={moi.id} nom={moi.nom} plein />
          {enLigne && <span title={SAUVEGARDE[sauvegarde].texte} className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${SAUVEGARDE[sauvegarde].couleur} ${sauvegarde === 'envoi' ? 'animate-pulse' : ''}`} />}
        </span>
        <span className="hidden text-sm font-semibold lg:block">{moi.nom}</span>
        <Icone nom="bas" className={`h-3.5 w-3.5 text-pierre transition ${ouvert ? 'rotate-180' : ''}`} />
      </motion.button>
      <Presence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.97 }} transition={{ duration: 0.18, ease: EASE }}
            style={{ transformOrigin: 'top right' }}
            className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-craie bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(18,18,18,0.4)]"
          >
            <div className="flex items-center gap-3 px-3 pb-3 pt-2.5">
              <AvatarMembre id={moi.id} nom={moi.nom} taille="lg" />
              <div>
                <div className="font-extrabold">{moi.nom}</div>
                <div className="text-xs text-pierre">{moi.titre}</div>
                {email && <div className="mt-0.5 text-xs text-pierre">{email}</div>}
              </div>
            </div>
            <div className="h-px bg-craie" />
            {enLigne && (
              <div className="mx-3 mt-2 flex items-center gap-2 text-xs text-pierre">
                <span className={`h-2 w-2 rounded-full ${SAUVEGARDE[sauvegarde].couleur}`} /> {SAUVEGARDE[sauvegarde].texte}
              </div>
            )}
            {!enLigne && (
              <button onClick={() => { setOuvert(false); onReinitialiser() }} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-papier">
                <Icone nom="reset" /> Recharger les données de démo
              </button>
            )}
            <button onClick={() => { setOuvert(false); onChanger() }} className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm hover:bg-papier">
              <Icone nom="sortie" /> {enLigne ? 'Se déconnecter' : 'Changer de profil'}
            </button>
          </motion.div>
        )}
      </Presence>
    </div>
  )
}
