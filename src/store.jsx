// Toutes les données passent par ici.
// En ligne (Supabase configuré) : connexion e-mail + mot de passe, données partagées et temps réel entre les trois.
// Hors ligne (pas de .env.local) : données de démo dans le navigateur, choix du profil sans mot de passe.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MEMBRES } from './config.js'
import { donneesDemo } from './demo.js'
import { maintenant, uid } from './lib.js'
import { INSTANCE, depuisEntree, enLigne, messageErreur, supabase, trierHistorique, versEntree, versLigne } from './supabase.js'
import * as W from './workflow.js'

const CLE = 'atelier-donnees-v2'
const CLE_MOI = 'atelier-moi'
const DELAI_SAUVEGARDE = 450

const lireLocal = (cle) => { try { return localStorage.getItem(cle) } catch { return null } }
const ecrireLocal = (cle, v) => { try { v == null ? localStorage.removeItem(cle) : localStorage.setItem(cle, v) } catch {} }

function chargerLocal() {
  try {
    const brut = lireLocal(CLE)
    if (brut) return JSON.parse(brut)
  } catch {}
  return donneesDemo()
}

const Contexte = createContext(null)

export function StoreProvider({ children }) {
  const [data, setData] = useState(() => (enLigne ? { dossiers: [] } : chargerLocal()))
  // local | verification | deconnecte | sansPlace | chargement | pret
  const [etat, setEtat] = useState(enLigne ? 'verification' : 'local')
  const [session, setSession] = useState(null)
  const [moiId, setMoiId] = useState(() => (enLigne ? null : lireLocal(CLE_MOI)))
  const [erreur, setErreurBrute] = useState(null)
  const [toast, setToast] = useState(null)
  const [sauvegarde, setSauvegarde] = useState('ok') // ok | envoi | erreur
  const dataRef = useRef(data)
  dataRef.current = data
  const moiRef = useRef(moiId)
  moiRef.current = moiId

  const setErreur = useCallback((e) => setErreurBrute(e ? messageErreur(e) : null), [])
  const notifier = useCallback((texte) => {
    const id = uid('t')
    setToast({ id, texte })
    setTimeout(() => setToast((t) => (t?.id === id ? null : t)), 3200)
  }, [])

  // ─────────────────────────── Mode local ───────────────────────────
  useEffect(() => { if (!enLigne) ecrireLocal(CLE, JSON.stringify(data)) }, [data])

  // ─────────────────────────── Connexion (en ligne) ───────────────────────────
  useEffect(() => {
    if (!enLigne) return
    supabase.auth.getSession().then(({ data: { session: s } }) => { setSession(s); if (!s) setEtat('deconnecte') })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s)
      if (!s) { setEtat('deconnecte'); setMoiId(null); setData({ dossiers: [] }) }
    })
    return () => subscription.unsubscribe()
  }, [])

  // Une session : on cherche ma place, puis on charge tout.
  const userId = session?.user?.id
  useEffect(() => {
    if (!enLigne || !userId) return
    let annule = false
    ;(async () => {
      setEtat((e) => (e === 'pret' ? e : 'chargement'))
      const { data: place, error } = await supabase.rpc('mon_membre')
      if (annule) return
      if (error) { setErreur(error); setEtat('sansPlace'); return }
      if (!place) { setEtat('sansPlace'); return }
      setMoiId(place)
      await toutCharger()
      if (!annule) setEtat('pret')
    })()
    return () => { annule = true }
  }, [userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const connus = useRef(new Set()) // entrées d'historique déjà en base

  async function toutCharger() {
    const [{ data: lignes, error: e1 }, { data: entrees, error: e2 }] = await Promise.all([
      supabase.from('dossiers').select('id, data').order('cree_le', { ascending: false }),
      supabase.from('historique').select('*').order('date', { ascending: false }),
    ])
    if (e1 || e2) { setErreur(e1 || e2); return }
    const parDossier = {}
    entrees.forEach((r) => { (parDossier[r.dossier_id] ||= []).push(depuisEntree(r)); connus.current.add(r.id) })
    setData({ dossiers: lignes.map((l) => ({ ...l.data, id: l.id, historique: trierHistorique(parDossier[l.id] || []) })) })
  }

  const seConnecter = useCallback(async (email, motDePasse) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: motDePasse })
    if (error) throw new Error(messageErreur(error))
  }, [])

  const placesLibres = useCallback(async () => {
    const { data: r, error } = await supabase.rpc('places_libres')
    if (error) throw new Error(messageErreur(error))
    return r || []
  }, [])

  const rejoindre = useCallback(async (id) => {
    const { data: place, error } = await supabase.rpc('rejoindre', { p_id: id })
    if (error) throw new Error(messageErreur(error))
    setMoiId(place)
    setEtat('chargement')
    await toutCharger()
    setEtat('pret')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const connecter = useCallback((id) => { setMoiId(id); ecrireLocal(CLE_MOI, id) }, []) // mode local
  const deconnecter = useCallback(async () => {
    if (enLigne) { await supabase.auth.signOut(); return }
    setMoiId(null); ecrireLocal(CLE_MOI, null)
  }, [])

  // ─────────────────────────── Sauvegarde (en ligne) ───────────────────────────
  // Chaque dossier modifié est envoyé ~0,5 s après la dernière frappe ; l'historique, lui, est ajouté ligne par ligne.
  const minuteurs = useRef({})
  const enAttente = useRef(new Set())

  const enVol = useRef(new Set())
  const envoyer = useCallback(async (id) => {
    delete minuteurs.current[id]
    // Un envoi à la fois par dossier : sinon on retente juste après.
    if (enVol.current.has(id)) { minuteurs.current[id] = setTimeout(() => envoyer(id), DELAI_SAUVEGARDE); return }
    const d = dataRef.current.dossiers.find((x) => x.id === id)
    if (!d) { enAttente.current.delete(id); return }
    enVol.current.add(id)
    setSauvegarde('envoi')
    const { error } = await supabase.from('dossiers').upsert(versLigne(d, moiRef.current))
    const nouvelles = (d.historique || []).filter((h) => !connus.current.has(h.id))
    let e2 = null
    if (!error && nouvelles.length) {
      ;({ error: e2 } = await supabase.from('historique').upsert(nouvelles.map((h) => versEntree(h, id)), { onConflict: 'id', ignoreDuplicates: true }))
      if (!e2) nouvelles.forEach((h) => connus.current.add(h.id))
    }
    enVol.current.delete(id)
    if (!minuteurs.current[id]) enAttente.current.delete(id)
    if (error || e2) { setSauvegarde('erreur'); setErreur(error || e2) } else if (!Object.keys(minuteurs.current).length) setSauvegarde('ok')
  }, [setErreur])

  const planifier = useCallback((id) => {
    if (!enLigne) return
    enAttente.current.add(id)
    clearTimeout(minuteurs.current[id])
    minuteurs.current[id] = setTimeout(() => envoyer(id), DELAI_SAUVEGARDE)
    setSauvegarde('envoi')
  }, [envoyer])

  // Ne rien perdre si on ferme l'onglet pendant une saisie.
  useEffect(() => {
    if (!enLigne) return
    const f = (e) => { if (Object.keys(minuteurs.current).length) { Object.keys(minuteurs.current).forEach((id) => { clearTimeout(minuteurs.current[id]); envoyer(id) }); e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', f)
    return () => window.removeEventListener('beforeunload', f)
  }, [envoyer])

  // ─────────────────────────── Temps réel (en ligne) ───────────────────────────
  useEffect(() => {
    if (!enLigne || etat !== 'pret') return
    const canal = supabase.channel('atelier')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dossiers' }, (p) => {
        if (p.eventType === 'DELETE') {
          setData((x) => ({ ...x, dossiers: x.dossiers.filter((d) => d.id !== p.old.id) }))
          return
        }
        const l = p.new
        if (l.instance === INSTANCE || enAttente.current.has(l.id)) return // ma propre écriture, ou j'ai plus récent en cours
        setData((x) => {
          const avant = x.dossiers.find((d) => d.id === l.id)
          const d = { ...l.data, id: l.id, historique: avant?.historique || [] }
          return { ...x, dossiers: avant ? x.dossiers.map((y) => (y.id === l.id ? d : y)) : [d, ...x.dossiers] }
        })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'historique' }, (p) => {
        const r = p.new
        if (connus.current.has(r.id)) return
        connus.current.add(r.id)
        setData((x) => ({ ...x, dossiers: x.dossiers.map((d) => (d.id === r.dossier_id && !d.historique.some((h) => h.id === r.id) ? { ...d, historique: trierHistorique([depuisEntree(r), ...d.historique]) } : d)) }))
      })
      .subscribe()
    return () => { supabase.removeChannel(canal) }
  }, [etat])

  // ─────────────────────────── Actions sur les dossiers ───────────────────────────
  const majDossier = useCallback((id, fn) => {
    setData((d) => ({ ...d, dossiers: d.dossiers.map((x) => (x.id === id ? fn(x) : x)) }))
    planifier(id)
  }, [planifier])

  // Une étape du parcours : la fonction lève une erreur lisible si l'action n'est pas possible.
  const agir = useCallback((id, action, message) => {
    const d = dataRef.current.dossiers.find((x) => x.id === id)
    if (!d) return false
    try {
      const suivant = action(d)
      majDossier(id, () => suivant)
      if (message) notifier(message)
      return true
    } catch (e) {
      setErreurBrute(e.message)
      return false
    }
  }, [majDossier, notifier])

  // Modification directe des champs (saisie de l'audit, du devis…), sans entrée d'historique.
  const modifier = useCallback((id, fn) => majDossier(id, (d) => ({ ...fn(d), majLe: maintenant() })), [majDossier])

  const creerDossier = useCallback((champs) => {
    const d = W.nouveauDossier(champs, moiRef.current)
    setData((x) => ({ ...x, dossiers: [d, ...x.dossiers] }))
    planifier(d.id)
    return d.id
  }, [planifier])

  const commenter = useCallback((id, texte) => {
    if (!texte.trim()) return
    majDossier(id, (d) => W.journal(d, moiRef.current, texte.trim(), 'commentaire'))
  }, [majDossier])

  const supprimer = useCallback(async (id) => {
    clearTimeout(minuteurs.current[id]); delete minuteurs.current[id]; enAttente.current.delete(id)
    setData((x) => ({ ...x, dossiers: x.dossiers.filter((d) => d.id !== id) }))
    if (enLigne) {
      const { error } = await supabase.from('dossiers').delete().eq('id', id)
      if (error) setErreur(error)
    }
  }, [setErreur])

  // Numéro du prochain devis : D-AAAA-001, D-AAAA-002… (le plus grand numéro de l'année + 1).
  const prochainNumero = useCallback(() => {
    const annee = new Date().getFullYear()
    const max = dataRef.current.dossiers.reduce((m, d) => {
      const r = d.devis?.numero?.match(new RegExp(`^D-${annee}-(\\d+)$`))
      return r ? Math.max(m, Number(r[1])) : m
    }, 0)
    return `D-${annee}-${String(max + 1).padStart(3, '0')}`
  }, [])

  const reinitialiser = useCallback(() => { if (!enLigne) { setData(donneesDemo()); notifier('Données de démo rechargées') } }, [notifier])

  const moi = MEMBRES.find((m) => m.id === moiId) || null
  const valeur = useMemo(() => ({
    data, moi, etat, enLigne, email: session?.user?.email, sauvegarde,
    connecter, deconnecter, seConnecter, placesLibres, rejoindre,
    agir, modifier, creerDossier, commenter, supprimer, prochainNumero, reinitialiser,
    erreur, setErreur, effacerErreur: () => setErreurBrute(null), toast, notifier,
  }), [data, moi, etat, session, sauvegarde, connecter, deconnecter, seConnecter, placesLibres, rejoindre, agir, modifier, creerDossier, commenter, supprimer, prochainNumero, reinitialiser, erreur, setErreur, toast, notifier])

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>
}

export const useStore = () => useContext(Contexte)

// Raccourci : le dossier courant et les actions liées à mon identifiant.
export function useDossier(id) {
  const s = useStore()
  const d = s.data.dossiers.find((x) => x.id === id)
  return { ...s, d }
}
