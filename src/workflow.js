// Le parcours d'un dossier : prospect → audit → revue → devis → validation à 3 → chez le client → delivery → livré.
// Fonctions pures : elles reçoivent un dossier et rendent le dossier suivant (ou lèvent une erreur lisible).
import { ETAPES, MEMBRES, TARIFS, etape, membre } from './config.js'
import { aujourdhui, decalerJour, euros, jourISO, maintenant, uid } from './lib.js'

// ─────────────────────────── Création ───────────────────────────

export const auditVide = () => ({
  business: { offre: '', prix: '', caMensuel: '', ventesMois: '', acquisition: [] },
  equipe: { setters: 0, closers: 0, managers: 0, support: 0, notes: '' },
  process: { acquisition: '', setting: '', closing: '', onboarding: '' },
  outils: { liste: [], notes: '' },
  chiffres: { leadsMois: '', tauxShow: '', tauxClosing: '', panier: '' },
  douleurs: { texte: '', urgence: '' },
  propositions: [],
  callLe: '',
  soumisLe: null,
  retours: [],
})

export function nouveauDossier(champs, qui) {
  const d = {
    id: uid('d'),
    nom: '',
    business: '',
    niche: '',
    canal: '',
    contact: { email: '', telephone: '', instagram: '' },
    tailleCA: '',
    creeLe: maintenant(),
    etape: 'prospect',
    prospection: { statut: 'a_contacter', relance: '', callLe: '', notes: '' },
    audit: null,
    devis: null,
    delivery: null,
    perdu: null,
    historique: [],
    ...champs,
  }
  d.etatLe = d.creeLe
  return journal(d, qui, 'a créé le prospect', 'etape')
}

export function journal(d, qui, texte, type = 'note') {
  return { ...d, historique: [{ id: uid('h'), date: maintenant(), qui, texte, type }, ...(d.historique || [])] }
}

const verifier = (condition, message) => { if (!condition) throw new Error(message) }
// Changer d'état remet le compteur d'attente à zéro (etatLe).
const deplacer = (d, vers, qui, texte) => journal({ ...d, etape: vers, majLe: maintenant(), etatLe: maintenant() }, qui, texte, 'etape')

// ─────────────────────────── Qui doit agir ? ───────────────────────────

export const roleDe = (moiId) => membre(moiId)?.role

// Les membres attendus sur ce dossier, à cette étape.
export function attendus(d) {
  if (d.perdu) return []
  const e = etape(d.etape)
  if (e.qui === 'tous') {
    const manquent = MEMBRES.filter((m) => !d.devis?.validations?.[m.id]).map((m) => m.id)
    // Validé à trois : c'est à Martin de l'envoyer au client.
    return manquent.length ? manquent : MEMBRES.filter((m) => m.role === 'dev').map((m) => m.id)
  }
  if (!e.qui) return []
  return MEMBRES.filter((m) => m.role === e.qui).map((m) => m.id)
}
export const aMoiDeJouer = (d, moiId) => attendus(d).includes(moiId)

// Le rôle responsable peut agir. Tout le monde peut voir et commenter.
export const peutAgir = (d, moiId) => {
  const e = etape(d.etape)
  return e.qui === 'tous' || e.qui === roleDe(moiId)
}

// ─────────────────────────── Prospection (Nino) ───────────────────────────

export function changerStatutProspect(d, statut, qui) {
  verifier(d.etape === 'prospect', 'Ce dossier a déjà quitté la prospection.')
  const libelles = { a_contacter: 'à contacter', contacte: 'contacté', call_prevu: 'call prévu', call_fait: 'call fait' }
  return journal({ ...d, etatLe: maintenant(), prospection: { ...d.prospection, statut } }, qui, `a passé le prospect en « ${libelles[statut]} »`, 'etape')
}

// Premier message envoyé : relance prévue dans 3 jours.
export function contacter(d, qui) {
  const x = changerStatutProspect(d, 'contacte', qui)
  return { ...x, prospection: { ...x.prospection, relance: decalerJour(aujourdhui(), 3) } }
}

export function relancerProspect(d, qui) {
  verifier(d.etape === 'prospect', 'Ce dossier a déjà quitté la prospection.')
  return journal({ ...d, etatLe: maintenant(), prospection: { ...d.prospection, relance: decalerJour(aujourdhui(), 3) } }, qui, 'a relancé le prospect (prochaine relance dans 3 jours)', 'etape')
}

export function planifierCall(d, qui, date) {
  verifier(date, 'Choisis la date du call.')
  const x = changerStatutProspect(d, 'call_prevu', qui)
  return { ...x, prospection: { ...x.prospection, callLe: date, relance: '' } }
}

// Call signé : le dossier part chez Hugo, avec un audit vierge.
export function passerAudit(d, qui) {
  verifier(d.etape === 'prospect' && !d.perdu, 'Seul un prospect actif peut passer à l’audit.')
  const audit = d.audit || auditVide()
  return deplacer({ ...d, audit, prospection: { ...d.prospection, statut: 'call_fait', gagneLe: aujourdhui() } }, 'audit', qui, 'a signé le call et passé le dossier à Hugo pour l’audit')
}

// ─────────────────────────── Audit (Hugo) ───────────────────────────

const rempli = (v) => (Array.isArray(v) ? v.length > 0 : typeof v === 'number' ? v > 0 : !!String(v ?? '').trim())

export const SECTIONS_AUDIT = [
  { id: 'business', label: 'Business', test: (a) => rempli(a.business.offre) && rempli(a.business.caMensuel) },
  { id: 'equipe', label: 'Équipe', test: (a) => a.equipe.setters + a.equipe.closers + a.equipe.managers + a.equipe.support > 0 || rempli(a.equipe.notes) },
  { id: 'process', label: 'Process actuel', test: (a) => Object.values(a.process).filter(rempli).length >= 2 },
  { id: 'outils', label: 'Outils', test: (a) => rempli(a.outils.liste) || rempli(a.outils.notes) },
  { id: 'chiffres', label: 'Chiffres', test: (a) => Object.values(a.chiffres).filter(rempli).length >= 2 },
  { id: 'douleurs', label: 'Problèmes', test: (a) => rempli(a.douleurs.texte) },
  { id: 'propositions', label: 'Ce qu’on peut faire', test: (a) => a.propositions.length > 0 },
]

export function completionAudit(audit) {
  if (!audit) return { faits: 0, total: SECTIONS_AUDIT.length, sections: {} }
  const sections = Object.fromEntries(SECTIONS_AUDIT.map((s) => [s.id, s.test(audit)]))
  return { faits: Object.values(sections).filter(Boolean).length, total: SECTIONS_AUDIT.length, sections }
}

export function soumettreAudit(d, qui) {
  verifier(d.etape === 'audit', 'L’audit n’est pas en cours.')
  verifier(d.audit.propositions.length > 0, 'Ajoute au moins une proposition dans « Ce qu’on peut faire ».')
  const relu = d.audit.retours.length > 0
  return deplacer({ ...d, audit: { ...d.audit, soumisLe: maintenant() } }, 'revue', qui, relu ? 'a corrigé l’audit et l’a renvoyé en revue technique' : 'a terminé l’audit et l’a envoyé en revue technique')
}

// ─────────────────────────── Revue technique (Martin) ───────────────────────────

export const VERDICTS = [
  { id: 'ok', label: 'Faisable' },
  { id: 'reserve', label: 'Avec réserves' },
  { id: 'non', label: 'Pas faisable' },
]

export function renvoyerAudit(d, qui, message) {
  verifier(d.etape === 'revue', 'L’audit n’est pas en revue.')
  verifier(message?.trim(), 'Dis à Hugo ce qui manque ou ce qu’il faut revoir.')
  const audit = { ...d.audit, retours: [{ id: uid('r'), date: maintenant(), qui, texte: message.trim() }, ...d.audit.retours] }
  return deplacer({ ...d, audit }, 'audit', qui, `a renvoyé l’audit à Hugo : « ${message.trim()} »`)
}

export function validerAudit(d, qui, numero) {
  verifier(d.etape === 'revue', 'L’audit n’est pas en revue.')
  const props = d.audit.propositions
  verifier(props.every((p) => p.revue?.verdict), 'Donne un verdict à chaque proposition avant de valider.')
  const retenues = props.filter((p) => p.revue.verdict !== 'non')
  verifier(retenues.length > 0, 'Aucune proposition faisable : renvoie l’audit à Hugo plutôt.')
  // Le devis part des propositions retenues, au tarif journalier par défaut.
  const devis = d.devis || {
    numero,
    lignes: retenues.map((p) => ({ id: uid('l'), propositionId: p.id, titre: p.titre, description: p.description, jours: Number(p.revue.jours) || Number(p.jours) || 0, prix: (Number(p.revue.jours) || Number(p.jours) || 0) * TARIFS.tjm })),
    tjm: TARIFS.tjm,
    remise: 0,
    acompte: TARIFS.acompte,
    maintenance: 0,
    delaiSemaines: Math.max(2, Math.ceil(retenues.reduce((s, p) => s + (Number(p.revue.jours) || Number(p.jours) || 0), 0) / 4)),
    conditions: '',
    validations: {},
    modifs: [],
    envoyeLe: null,
    accepteLe: null,
    creeLe: maintenant(),
  }
  return deplacer({ ...d, devis }, 'devis', qui, `a validé l’audit (${retenues.length}/${props.length} propositions retenues)`)
}

// ─────────────────────────── Devis (Martin) ───────────────────────────

export function totalDevis(devis) {
  if (!devis) return { brut: 0, remise: 0, total: 0, acompte: 0, solde: 0, mensuel: 0, jours: 0 }
  const brut = devis.lignes.reduce((s, l) => s + (Number(l.prix) || 0), 0)
  const remise = Math.min(brut, Number(devis.remise) || 0)
  const total = brut - remise
  const acompte = Math.round((total * (Number(devis.acompte) || 0)) / 100)
  return { brut, remise, total, acompte, solde: total - acompte, mensuel: Number(devis.maintenance) || 0, jours: devis.lignes.reduce((s, l) => s + (Number(l.jours) || 0), 0) }
}

export function soumettreDevis(d, qui) {
  verifier(d.etape === 'devis', 'Le devis n’est pas en préparation.')
  verifier(d.devis.lignes.length > 0, 'Le devis n’a aucune ligne.')
  verifier(totalDevis(d.devis).total > 0, 'Le devis est à 0 €.')
  // Martin l'a préparé : sa validation est acquise, il reste les deux autres.
  const validations = { [qui]: maintenant() }
  return deplacer({ ...d, devis: { ...d.devis, validations } }, 'validation', qui, 'a soumis le devis à la validation de l’équipe')
}

export const nbValidations = (d) => MEMBRES.filter((m) => d.devis?.validations?.[m.id]).length
export const devisValide = (d) => nbValidations(d) === MEMBRES.length

export function voterDevis(d, qui) {
  verifier(d.etape === 'validation', 'Le devis n’attend pas de validation.')
  verifier(!d.devis.validations[qui], 'Tu as déjà validé ce devis.')
  const v = journal({ ...d, devis: { ...d.devis, validations: { ...d.devis.validations, [qui]: maintenant() } } }, qui, 'a validé le devis', 'etape')
  return devisValide(v) ? journal(v, qui, 'Devis validé à 3 sur 3 : prêt à partir chez le client', 'etape') : v
}

export function demanderModif(d, qui, message) {
  verifier(['validation', 'envoye'].includes(d.etape), 'Le devis n’est pas en validation.')
  verifier(message?.trim(), 'Explique la modification demandée.')
  const devis = { ...d.devis, validations: {}, envoyeLe: null, modifs: [{ id: uid('m'), date: maintenant(), qui, texte: message.trim() }, ...(d.devis.modifs || [])] }
  return deplacer({ ...d, devis }, 'devis', qui, `a demandé une modification du devis : « ${message.trim()} »`)
}

export function envoyerDevis(d, qui) {
  verifier(d.etape === 'validation', 'Le devis n’est pas en validation.')
  verifier(devisValide(d), 'Il manque des validations : le devis part quand les trois ont validé.')
  return deplacer({ ...d, devis: { ...d.devis, envoyeLe: maintenant() } }, 'envoye', qui, 'a envoyé le devis au client')
}

export function relancerClient(d, qui) {
  verifier(d.etape === 'envoye', 'Le devis n’est pas chez le client.')
  return journal({ ...d, etatLe: maintenant(), devis: { ...d.devis, relanceLe: maintenant() } }, qui, 'a relancé le client', 'etape')
}

export function accepterDevis(d, qui) {
  verifier(d.etape === 'envoye', 'Le devis n’est pas chez le client.')
  return journal({ ...d, etatLe: maintenant(), devis: { ...d.devis, accepteLe: maintenant() } }, qui, 'Le client a accepté le devis', 'etape')
}

// Contrat signé : la delivery démarre, les lignes du devis deviennent les livrables.
export function signer(d, qui) {
  verifier(d.etape === 'envoye', 'Le devis n’est pas chez le client.')
  const t = totalDevis(d.devis)
  const debut = aujourdhui()
  const fin = new Date(`${debut}T12:00:00`)
  fin.setDate(fin.getDate() + (Number(d.devis.delaiSemaines) || 4) * 7)
  const delivery = {
    debut,
    livraisonPrevue: jourISO(fin),
    livrables: d.devis.lignes.map((l) => ({ id: uid('v'), titre: l.titre, description: l.description, statut: 'a_faire' })),
    paiements: [
      { id: uid('p'), libelle: `Acompte ${d.devis.acompte} %`, montant: t.acompte, recuLe: null },
      { id: uid('p'), libelle: 'Solde à la livraison', montant: t.solde, recuLe: null },
    ].filter((p) => p.montant > 0),
    notes: '',
  }
  const devis = { ...d.devis, accepteLe: d.devis.accepteLe || maintenant(), signeLe: maintenant() }
  return deplacer({ ...d, devis, delivery }, 'delivery', qui, `Contrat signé (${euros(t.total)}) : la delivery démarre`)
}

export function avancement(d) {
  const l = d.delivery?.livrables || []
  return { faits: l.filter((x) => x.statut === 'livre').length, total: l.length }
}

export function livrer(d, qui) {
  verifier(d.etape === 'delivery', 'Le projet n’est pas en delivery.')
  const a = avancement(d)
  verifier(a.total > 0 && a.faits === a.total, 'Tous les livrables doivent être livrés avant de clôturer.')
  return deplacer({ ...d, delivery: { ...d.delivery, livreLe: aujourdhui() } }, 'livre', qui, 'a livré le projet au client 🎉')
}

// ─────────────────────────── Perdu / réactivé ───────────────────────────

export function perdre(d, qui, raison) {
  verifier(!['delivery', 'livre'].includes(d.etape), 'Un projet signé ne peut plus être perdu.')
  return journal({ ...d, perdu: { raison: raison?.trim() || '', date: maintenant(), etape: d.etape } }, qui, `a classé le dossier comme perdu${raison?.trim() ? ` : « ${raison.trim()} »` : ''}`, 'etape')
}

export function reactiver(d, qui) {
  verifier(d.perdu, 'Ce dossier n’est pas perdu.')
  return journal({ ...d, perdu: null, etatLe: maintenant() }, qui, 'a réactivé le dossier', 'etape')
}

export const ORDRE = ETAPES.map((e) => e.id)
