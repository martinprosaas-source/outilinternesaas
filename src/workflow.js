// Le parcours d'un dossier : prospect → audit → revue → devis → validation à 3 → chez le client → delivery → livré.
// Fonctions pures : elles reçoivent un dossier et rendent le dossier suivant (ou lèvent une erreur lisible).
import { ETAPES, MEMBRES, TARIFS, etape, membre } from './config.js'
import { aujourdhui, decalerJour, euros, jourISO, maintenant, uid } from './lib.js'
import { BLOCS, cleItem } from './trame.js'

// ─────────────────────────── Création ───────────────────────────

// L'audit suit la trame (src/trame.js) : les 9 blocs, puis le livrable en 5 parties que Martin lit en revue.
export const auditVide = () => ({
  callLe: '',
  entretiens: {},   // { dirigeant: true, closer: true, … }
  coches: {},       // { 'business.offres': true } : les cases couvertes
  notes: {},        // { business: '…' } : ce qu'ils ont dit, bloc par bloc
  pieces: [],       // { id, bloc, nom, lien } : les preuves
  fiche: {
    budget: '', decideurDevis: '', lancement: '', dateDepart: '', valideurRecette: '', exclus: '', tunnel: '', externes: '',
    offres: [], sources: [], equipe: [],
    volumes: { leads: '', rdv: '', ventes: '', ca: '' },
    decideurs: { commissions: '', chiffres: '', acces: '', budget: '' },
  },
  besoins: [],      // { id, qui, besoin, pour, priorite, preuve, revue: { verdict, jours, commentaire } }
  regles: [],       // { id, regle, exemple, validePar }
  recette: [],      // { id, texte }
  acces: [],        // { id, outil, abonnement, api, admin, cles, quand }
  questions: [],    // { id, texte, aQui, item, reponse }
  soumisLe: null,
  retours: [],
})

// Complète un audit partiel (ou ancien) avec les champs vides : l'écran peut tout lire sans se poser de questions.
export function normaliserAudit(a) {
  const v = auditVide()
  if (!a) return v
  const f = a.fiche || {}
  return { ...v, ...a, fiche: { ...v.fiche, ...f, volumes: { ...v.fiche.volumes, ...f.volumes }, decideurs: { ...v.fiche.decideurs, ...f.decideurs } } }
}

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

// Une case est couverte (cochée) ou notée en question ouverte ; sinon elle reste à faire.
export function etatItem(audit, cle) {
  if (audit.coches?.[cle]) return 'ok'
  if (audit.questions?.some((q) => q.item === cle)) return 'question'
  return null
}

export function completionAudit(audit) {
  const a = normaliserAudit(audit)
  const blocs = Object.fromEntries(BLOCS.map((b) => {
    const etats = b.items.map((i) => etatItem(a, cleItem(b.id, i.id)))
    const faits = etats.filter(Boolean).length
    return [b.id, { faits, total: etats.length, questions: etats.filter((e) => e === 'question').length, termine: faits === etats.length }]
  }))
  return { faits: Object.values(blocs).filter((b) => b.termine).length, total: BLOCS.length, blocs }
}

export const besoinsAChiffrer = (a) => (a?.besoins || []).filter((b) => b.priorite !== 'hors')
export const questionsOuvertes = (a) => (a?.questions || []).filter((q) => !q.reponse?.trim())

export function soumettreAudit(d, qui) {
  verifier(d.etape === 'audit', 'L’audit n’est pas en cours.')
  const a = normaliserAudit(d.audit)
  const c = completionAudit(a)
  const restants = BLOCS.filter((b) => !c.blocs[b.id].termine)
  verifier(!restants.length, `Il reste ${restants.length} bloc${restants.length > 1 ? 's' : ''} à terminer (${restants.map((b) => b.titre).join(', ')}). Coche chaque case, ou note le manque en question ouverte.`)
  verifier(a.besoins.length > 0, 'Ajoute au moins un besoin dans « La liste des besoins ».')
  verifier(a.besoins.every((b) => b.besoin?.trim() && b.priorite), 'Chaque besoin doit dire de quoi il s’agit et avoir une priorité.')
  verifier(a.besoins.some((b) => b.priorite === 'indispensable'), 'Au moins un besoin doit être indispensable au lancement.')
  const relu = a.retours.length > 0
  return deplacer({ ...d, audit: { ...a, soumisLe: maintenant() } }, 'revue', qui, relu ? 'a corrigé l’audit et l’a renvoyé en revue technique' : 'a terminé l’audit et l’a envoyé en revue technique')
}

// ─────────────────────────── Revue technique (Martin) ───────────────────────────

export const VERDICTS = [
  { id: 'ok', label: 'Faisable' },
  { id: 'reserve', label: 'Avec réserves' },
  { id: 'non', label: 'Pas faisable' },
]

// Le verdict d'ensemble, tiré des verdicts sur les besoins indispensables.
export function verdictGlobal(a) {
  const v = (a?.besoins || []).filter((b) => b.priorite === 'indispensable').map((b) => b.revue?.verdict)
  if (!v.length || v.some((x) => !x)) return null
  if (v.every((x) => x === 'ok')) return 'ok'
  if (v.every((x) => x === 'non')) return 'non'
  return 'reserve'
}

// Les besoins indispensables ont tous un verdict, et au moins un est faisable.
export function pretAValider(a) {
  const ind = (a?.besoins || []).filter((b) => b.priorite === 'indispensable')
  return ind.length > 0 && ind.every((b) => b.revue?.verdict) && ind.some((b) => b.revue.verdict !== 'non')
}

const joursDe = (b) => Number(b.revue?.jours) || 0
const majuscule = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t)

export function renvoyerAudit(d, qui, message) {
  verifier(d.etape === 'revue', 'L’audit n’est pas en revue.')
  verifier(message?.trim(), 'Dis à Hugo ce qui manque ou ce qu’il faut revoir.')
  const a = normaliserAudit(d.audit)
  const audit = { ...a, retours: [{ id: uid('r'), date: maintenant(), qui, texte: message.trim() }, ...a.retours] }
  return deplacer({ ...d, audit }, 'audit', qui, `a renvoyé l’audit à Hugo : « ${message.trim()} »`)
}

export function validerAudit(d, qui, numero) {
  verifier(d.etape === 'revue', 'L’audit n’est pas en revue.')
  const a = normaliserAudit(d.audit)
  const ind = a.besoins.filter((b) => b.priorite === 'indispensable')
  verifier(ind.every((b) => b.revue?.verdict), 'Donne un verdict à chaque besoin indispensable avant de valider.')
  const retenus = ind.filter((b) => b.revue.verdict !== 'non')
  verifier(retenus.length > 0, 'Aucun besoin indispensable n’est faisable : renvoie l’audit à Hugo plutôt.')
  // Le devis part des besoins indispensables retenus ; le reste est écrit noir sur blanc dans les conditions.
  const plusTard = a.besoins.filter((b) => b.priorite === 'plus_tard')
  const exclus = [...a.besoins.filter((b) => b.priorite === 'hors' || (b.priorite === 'indispensable' && b.revue.verdict === 'non')).map((b) => b.besoin), ...(a.fiche.exclus.trim() ? [a.fiche.exclus.trim()] : [])]
  const outils = a.acces.map((x) => x.outil).filter(Boolean)
  const conditions = [
    plusTard.length && `Prévu plus tard, hors de ce devis : ${plusTard.map((b) => b.besoin).join(' ; ')}.`,
    exclus.length && `Exclu : ${exclus.join(' ; ')}.`,
    outils.length && `Accès à fournir : ${outils.join(', ')}.`,
  ].filter(Boolean).join('\n')
  const jours = retenus.reduce((s, b) => s + joursDe(b), 0)
  const devis = d.devis || {
    numero,
    lignes: retenus.map((b) => ({ id: uid('l'), besoinId: b.id, titre: majuscule(b.besoin.trim()), description: [b.qui, b.pour && `pour ${b.pour}`].filter(Boolean).join(' · '), jours: joursDe(b), prix: joursDe(b) * TARIFS.tjm })),
    tjm: TARIFS.tjm,
    remise: 0,
    acompte: TARIFS.acompte,
    maintenance: 0,
    delaiSemaines: Math.max(2, Math.ceil(jours / 4)),
    conditions,
    validations: {},
    modifs: [],
    envoyeLe: null,
    accepteLe: null,
    creeLe: maintenant(),
  }
  return deplacer({ ...d, audit: a, devis }, 'devis', qui, `a validé l’audit (${retenus.length}/${ind.length} besoins indispensables retenus)`)
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
    recette: (d.audit?.recette || []).filter((c) => c.texte?.trim()).map((c) => ({ id: uid('c'), texte: c.texte.trim(), ok: false })),
    valideurRecette: d.audit?.fiche?.valideurRecette || '',
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
