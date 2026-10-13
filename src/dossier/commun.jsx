// Briques partagées : pastille de suivi, phase, « qui a la balle ».
import { motion } from 'motion/react'
import { membre } from '../config.js'
import { AvatarMembre, Icone } from '../ui.jsx'
import * as S from '../suivi.js'

export const nomMembre = (id) => membre(id)?.nom || 'Quelqu’un'

const TONS = {
  ok: 'bg-craie/70 text-pierre',
  orange: 'bg-[#FFEBD2] text-[#A4520A]',
  rouge: 'bg-[#FDE0DD] text-[#B42318]',
}

// Depuis quand le dossier attend (ou J-x) : gris, puis orange, puis rouge.
export function PastilleSuivi({ d, className = '' }) {
  const texte = S.texteAttente(d)
  if (!texte) return null
  const n = S.niveau(d)
  return (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-bold tabular ${TONS[n]} ${className}`}>
      {n === 'rouge' ? <motion.span className="h-1.5 w-1.5 rounded-full bg-current" animate={{ opacity: [1, 0.25, 1] }} transition={{ duration: 1.4, repeat: Infinity }} /> : <Icone nom="horloge" className="h-3 w-3" epaisseur={2.4} />}
      {texte}
    </span>
  )
}

// Qui a la balle : avatars pleins dans la couleur de chacun, avec le prénom.
export function Balle({ d, avecNom = true, taille = 'sm' }) {
  const qui = S.balle(d)
  if (!qui.length) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex -space-x-1.5">{qui.map((m) => <AvatarMembre key={m.id} id={m.id} taille={taille} plein anneau />)}</span>
      {avecNom && <span className="text-[12px] font-bold" style={{ color: qui.length === 1 ? qui[0].couleur : undefined }}>{qui.map((m) => m.nom).join(', ')}</span>}
    </span>
  )
}

export function PastillePhase({ d }) {
  if (d.perdu) return <span className="inline-flex items-center rounded-full bg-[#FDE0DD] px-2.5 py-[3px] text-[11px] font-bold text-[#B42318]">Perdu</span>
  if (d.etape === 'livre') return <span className="inline-flex items-center gap-1 rounded-full bg-vert/10 px-2.5 py-[3px] text-[11px] font-bold text-vert"><Icone nom="coche" className="h-3 w-3" epaisseur={3} />Livré</span>
  const p = S.phase(d)
  const m = membre(p.qui)
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[11px] font-bold" style={{ background: m.fond, color: m.couleur }}><Icone nom={p.icone} className="h-3 w-3" epaisseur={2.4} />{p.label}</span>
}

export const initialesDossier = (d) => d.nom.split(' ').map((m) => m[0]).slice(0, 2).join('')
