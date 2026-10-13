// Connexion à Supabase. Sans les variables d'environnement, l'outil tourne en mode local (démo dans le navigateur).
import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = url && cle ? createClient(url, cle, { auth: { persistSession: true, autoRefreshToken: true } }) : null
export const enLigne = !!supabase

// Un identifiant par onglet : on ignore le retour temps réel de nos propres écritures.
export const INSTANCE = Math.random().toString(36).slice(2, 10)

// Le dossier est stocké sans son historique (qui a sa propre table, en ajout seul).
export const versLigne = (d, qui) => {
  const { historique, ...data } = d
  return { id: d.id, data, maj_le: new Date().toISOString(), maj_par: qui, instance: INSTANCE }
}
export const versEntree = (h, dossierId) => ({ id: h.id, dossier_id: dossierId, date: h.date, qui: h.qui, texte: h.texte, type: h.type })
export const depuisEntree = (r) => ({ id: r.id, date: r.date, qui: r.qui, texte: r.texte, type: r.type })
export const trierHistorique = (h) => [...h].sort((a, b) => (a.date < b.date ? 1 : -1))

// Messages d'erreur Supabase en français lisible.
export function messageErreur(e) {
  const m = e?.message || String(e)
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou mot de passe incorrect.'
  if (/Email not confirmed/i.test(m)) return 'Confirme d’abord ton adresse : clique sur le lien reçu par e-mail.'
  if (/User already registered/i.test(m)) return 'Un compte existe déjà avec cet e-mail : connecte-toi.'
  if (/Password should be at least/i.test(m)) return 'Le mot de passe doit faire au moins 6 caractères.'
  if (/rate limit/i.test(m)) return 'Trop de tentatives, réessaie dans quelques minutes.'
  if (/relation .* does not exist|Could not find the (table|function)|PGRST20[25]/i.test(m)) return 'La base n’est pas encore prête : exécute supabase/schema.sql dans Supabase.'
  if (/Failed to fetch|NetworkError/i.test(m)) return 'Pas de connexion à la base. Vérifie internet et réessaie.'
  return m
}
