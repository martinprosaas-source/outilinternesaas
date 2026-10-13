// Le suivi : depuis quand un dossier attend, s'il est en retard, et ce que chacun a à faire.
// Fonctions pures (testées dans suivi.test.js).
import { MEMBRES, delais, phaseDe } from './config.js'
import { aujourdhui, decalerJour, ecartJours, jourLocal, quand } from './lib.js'
import * as W from './workflow.js'

// ─────────────────────────── Attente ───────────────────────────

export const entreeEtat = (d) => d.etatLe || d.historique?.find((h) => h.type === 'etape')?.date || d.creeLe
export const attente = (d) => Math.max(0, ecartJours(entreeEtat(d), aujourdhui()))

const auditRenvoye = (d) => d.etape === 'audit' && d.audit?.retours?.length > 0 && (!d.audit.soumisLe || d.audit.retours[0].date > d.audit.soumisLe)

// L'échéance de l'état actuel : une date choisie (call, relance, livraison) ou « entrée + délai orange ».
export function echeance(d) {
  if (d.perdu || d.etape === 'livre') return null
  const e = jourLocal(entreeEtat(d))
  const { orange } = delais(d.etape)
  const p = d.prospection
  if (d.etape === 'prospect') {
    if (p.statut === 'call_prevu' && p.callLe) return { date: p.callLe, fixee: true }
    if (p.relance) return { date: p.relance, fixee: true }
    if (p.statut === 'call_fait') return { date: decalerJour(e, 1), fixee: false }
  }
  if (d.etape === 'audit' && !auditRenvoye(d) && d.audit?.callLe && d.audit.callLe >= e) {
    return d.audit.callLe >= aujourdhui() ? { date: d.audit.callLe, fixee: true } : { date: decalerJour(d.audit.callLe, orange), fixee: false }
  }
  if (d.etape === 'delivery') return { date: d.delivery.livraisonPrevue, fixee: true }
  if (d.etape === 'validation' && !W.devisValide(d)) return { date: decalerJour(e, 1), fixee: false }
  return { date: decalerJour(e, orange), fixee: false }
}

// 'ok' | 'orange' | 'rouge' : la couleur de la pastille de suivi.
export function niveau(d) {
  const ech = echeance(d)
  if (!ech) return 'ok'
  const reste = ecartJours(aujourdhui(), ech.date)
  if (d.etape === 'delivery') return reste < 0 ? 'rouge' : reste <= 3 ? 'orange' : 'ok'
  if (ech.fixee) return reste < 0 ? 'rouge' : reste === 0 ? 'orange' : 'ok'
  const { orange, rouge } = delais(d.etape)
  const n = attente(d)
  return n >= rouge ? 'rouge' : n >= orange ? 'orange' : 'ok'
}

// Le texte de la pastille : « 3 j », « demain », « J-12 », « 2 j de retard ».
export function texteAttente(d) {
  if (d.etape === 'livre' || d.perdu) return null
  if (d.etape === 'delivery') {
    const r = ecartJours(aujourdhui(), d.delivery.livraisonPrevue)
    return r < 0 ? `${-r} j de retard` : r === 0 ? 'livraison auj.' : `J-${r}`
  }
  const ech = echeance(d)
  if (ech?.fixee && ech.date >= aujourdhui()) return quand(ech.date)
  const n = attente(d)
  return n === 0 ? 'auj.' : `${n} j`
}

// ─────────────────────────── État lisible ───────────────────────────

export function etatTexte(d) {
  if (d.perdu) return d.perdu.raison ? `Perdu · ${d.perdu.raison}` : 'Perdu'
  const p = d.prospection
  switch (d.etape) {
    case 'prospect':
      if (p.statut === 'a_contacter') return 'À contacter'
      if (p.statut === 'contacte') return p.relance ? `Contacté · relance ${quand(p.relance)}` : 'Contacté'
      if (p.statut === 'call_prevu') return p.callLe ? `Call ${quand(p.callLe)}` : 'Call à planifier'
      return 'Call fait · à passer à Hugo'
    case 'audit': {
      if (auditRenvoye(d)) return 'Renvoyé par Martin · à corriger'
      if (d.audit.callLe && d.audit.callLe >= aujourdhui()) return `Call d’audit ${quand(d.audit.callLe)}`
      const c = W.completionAudit(d.audit)
      return `Audit en cours · ${c.faits}/${c.total}`
    }
    case 'revue': return 'En revue technique'
    case 'devis': return d.devis.modifs?.length ? 'Modification demandée' : 'À chiffrer'
    case 'validation': return W.devisValide(d) ? 'Validé à 3 · à envoyer' : `Validation ${W.nbValidations(d)}/3`
    case 'envoye': return d.devis.accepteLe ? 'Accepté · à signer' : 'Chez le client'
    case 'delivery': {
      const a = W.avancement(d)
      return `${a.total ? Math.round((a.faits / a.total) * 100) : 0} % livré · ${a.faits}/${a.total}`
    }
    case 'livre': return 'Livré'
    default: return ''
  }
}

// ─────────────────────────── Mes tâches ───────────────────────────
// Une tâche = ce que j'ai à faire sur un dossier, son échéance et les boutons qui la règlent.

export function tache(d, moiId) {
  if (d.perdu || !W.aMoiDeJouer(d, moiId)) return null
  const ech = echeance(d)
  const base = { d, echeance: ech?.date || aujourdhui(), fixee: !!ech?.fixee }
  const p = d.prospection
  switch (d.etape) {
    case 'prospect':
      if (p.statut === 'a_contacter') return { ...base, titre: 'Premier contact', actions: ['contacter', 'planifier'] }
      if (p.statut === 'contacte') return { ...base, titre: 'Relancer', actions: ['relancer', 'planifier'] }
      if (p.statut === 'call_prevu') return { ...base, titre: p.callLe ? 'Call' : 'Planifier le call', actions: p.callLe ? ['call_fait', 'planifier'] : ['planifier'] }
      return { ...base, titre: 'Call fait : on y va ?', actions: ['passer_audit', 'perdu'] }
    case 'audit':
      if (auditRenvoye(d)) return { ...base, titre: 'Corriger l’audit', detail: d.audit.retours[0].texte, actions: ['ouvrir_audit'] }
      if (d.audit.callLe && d.audit.callLe >= aujourdhui()) return { ...base, titre: 'Call d’audit', actions: ['ouvrir_audit'] }
      return { ...base, titre: d.audit.callLe ? 'Finir l’audit' : 'Planifier et faire l’audit', actions: ['ouvrir_audit'] }
    case 'revue': return { ...base, titre: 'Revue technique de l’audit', actions: ['ouvrir_revue'] }
    case 'devis': return { ...base, titre: d.devis.modifs?.length ? 'Modifier le devis' : 'Chiffrer le devis', detail: d.devis.modifs?.[0]?.texte, actions: ['ouvrir_devis'] }
    case 'validation':
      if (W.devisValide(d)) return { ...base, titre: 'Envoyer le devis au client', actions: ['envoyer', 'pdf'] }
      return { ...base, titre: 'Valider le devis', actions: ['valider', 'modif'] }
    case 'envoye':
      if (d.devis.accepteLe) return { ...base, titre: 'Faire signer le contrat', actions: ['signer', 'relancer_client'] }
      return { ...base, titre: 'Relancer le client', actions: ['relancer_client', 'signer'] }
    case 'delivery': {
      const a = W.avancement(d)
      if (a.total && a.faits === a.total) return { ...base, titre: 'Tout est livré : clôturer', actions: ['livrer'] }
      return { ...base, titre: `Livrer le projet · ${a.total - a.faits} livrable${a.total - a.faits > 1 ? 's' : ''} restant${a.total - a.faits > 1 ? 's' : ''}`, actions: ['ouvrir_delivery'] }
    }
    default: return null
  }
}

export const GROUPES = [
  { id: 'retard', label: 'En retard' },
  { id: 'aujourdhui', label: 'Aujourd’hui' },
  { id: 'semaine', label: 'Cette semaine' },
  { id: 'plus_tard', label: 'Plus tard' },
]
// Même règle que les pastilles : rouge = en retard, orange = aujourd'hui. Sinon, selon l'échéance.
export function groupe(t) {
  const n = niveau(t.d)
  if (n === 'rouge') return 'retard'
  if (n === 'orange') return 'aujourdhui'
  const r = ecartJours(aujourdhui(), t.echeance)
  return r < 0 ? 'retard' : r === 0 ? 'aujourdhui' : r <= 7 ? 'semaine' : 'plus_tard'
}

// L'échéance en mots, pour une ligne de tâche ou la carte d'action.
export function texteEcheance(t) {
  const n = niveau(t.d)
  const r = ecartJours(aujourdhui(), t.echeance)
  if (t.fixee || t.d.etape === 'delivery') {
    if (r < 0) return { texte: `en retard de ${-r} j`, niveau: 'rouge' }
    if (r === 0) return { texte: 'aujourd’hui', niveau: 'orange' }
    if (r === 1) return { texte: 'demain', niveau: 'ok' }
    return { texte: new Date(`${t.echeance}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }), niveau: n }
  }
  const j = attente(t.d)
  if (n === 'rouge') return { texte: `attend depuis ${j} j`, niveau: 'rouge' }
  if (n === 'orange') return { texte: `attend depuis ${j} j`, niveau: 'orange' }
  return { texte: r <= 0 ? 'aujourd’hui' : r === 1 ? 'd’ici demain' : `d’ici ${new Date(`${t.echeance}T12:00:00`).toLocaleDateString('fr-FR', { weekday: 'long' })}`, niveau: 'ok' }
}

const POIDS = { rouge: 0, orange: 1, ok: 2 }
export function mesTaches(dossiers, moiId) {
  return dossiers.map((d) => tache(d, moiId)).filter(Boolean)
    .sort((a, b) => POIDS[niveau(a.d)] - POIDS[niveau(b.d)] || (a.echeance < b.echeance ? -1 : a.echeance > b.echeance ? 1 : attente(b.d) - attente(a.d)))
}

// Pour le tableau : qui a la balle sur ce dossier (avatars) et dans quelle phase il est.
export const balle = (d) => W.attendus(d).map((id) => MEMBRES.find((m) => m.id === id))
export const phase = (d) => phaseDe(d.etape)
