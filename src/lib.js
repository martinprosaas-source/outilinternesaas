// Petits outils partagés : identifiants, dates, montants.

export const uid = (prefixe = 'x') => `${prefixe}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const initiales = (nom = '') =>
  nom.trim().split(/\s+/).slice(0, 2).map((m) => m[0]?.toUpperCase() || '').join('') || '·'

export const normaliser = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

// ── Montants (euros, à la française : « 12 400 € ») ──
const fmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
// L'espace fine insécable de fr-FR (U+202F) n'existe pas dans la police : on la remplace par une espace insécable.
export const euros = (v) => `${fmt.format(Math.round(Number(v) || 0)).replace(/\u202f/g, '\u00a0')}\u00a0€`
export const eurosCourts = (v) => {
  const n = Number(v) || 0
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: n % 1000 === 0 ? 0 : 1 })} k€`
  return euros(n)
}

// ── Dates (ISO « AAAA-MM-JJ » pour les jours, ISO complet pour les horodatages) ──
const pad = (n) => String(n).padStart(2, '0')
export const jourISO = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const aujourdhui = () => jourISO()
export const maintenant = () => new Date().toISOString()
export const decalerJour = (iso, n) => {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + n)
  return jourISO(d)
}
// Jour local d'une date ISO : « 2026-10-12 » tel quel, un horodatage converti dans le fuseau du navigateur.
export const jourLocal = (iso) => (!iso ? '' : iso.length === 10 ? iso : jourISO(new Date(iso)))
export const ecartJours = (a, b) => Math.round((new Date(`${jourLocal(b)}T12:00:00`) - new Date(`${jourLocal(a)}T12:00:00`)) / 86400000)

export const dateCourte = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '')
export const dateLongue = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '')

// « aujourd'hui », « demain », « il y a 3 j », « dans 5 j »
export function quand(iso) {
  if (!iso) return ''
  const n = ecartJours(aujourdhui(), iso)
  if (n === 0) return 'aujourd’hui'
  if (n === 1) return 'demain'
  if (n === -1) return 'hier'
  if (n < 0) return `il y a ${-n} j`
  if (n < 7) return `dans ${n} j`
  return dateCourte(iso)
}

// Horodatage relatif pour le fil d'activité.
export function depuis(iso) {
  if (!iso) return ''
  const min = Math.round((Date.now() - new Date(iso)) / 60000)
  if (min < 1) return 'à l’instant'
  if (min < 60) return `il y a ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `il y a ${h} h`
  return quand(jourLocal(iso))
}

export const pluriel = (n, mot, motPluriel = `${mot}s`) => `${n} ${n > 1 ? motPluriel : mot}`
