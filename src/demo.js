// Données de démonstration : un dossier à chaque étape du parcours, pour valider l'interface à trois.
// Les dossiers sont construits avec les vraies fonctions du parcours, puis leurs dates sont étalées dans le passé.
import { CATALOGUE } from './config.js'
import { decalerJour, aujourdhui, jourLocal, uid } from './lib.js'
import * as W from './workflow.js'

const prop = (titre, impact, jours) => {
  const c = CATALOGUE.find((x) => x.titre === titre)
  return { id: uid('p'), titre, description: c?.description || '', impact, jours: jours ?? c?.jours ?? 3, revue: {} }
}

function auditComplet({ offre, prix, ca, ventes, setters, closers, managers = 0, support = 0, outils, leads, show, closing, panier, douleurs, propositions }) {
  return {
    ...W.auditVide(),
    business: { offre, prix, caMensuel: ca, ventesMois: ventes, acquisition: ['Instagram', 'YouTube'] },
    equipe: { setters, closers, managers, support, notes: '' },
    process: {
      acquisition: 'Contenu organique Instagram + YouTube, lien en bio vers un formulaire Typeform.',
      setting: 'Les setters qualifient en DM puis posent un call dans le Calendly des closers.',
      closing: 'Call Zoom de 45 min, paiement en 1x ou 3x via Stripe.',
      onboarding: 'Ajout manuel sur Skool + message WhatsApp de bienvenue.',
    },
    outils: { liste: outils, notes: '' },
    chiffres: { leadsMois: leads, tauxShow: show, tauxClosing: closing, panier },
    douleurs: { texte: douleurs, urgence: 'Haute' },
    propositions,
  }
}

// Étale les entrées d'historique entre « il y a `debut` jours » et « il y a `fin` jours ».
function dater(d, debut, fin = 0) {
  const h = [...d.historique].reverse()
  const pas = h.length > 1 ? (debut - fin) / (h.length - 1) : 0
  const dates = h.map((_, i) => {
    const t = new Date()
    t.setHours(9 + ((i * 3) % 9), (i * 17) % 60, 0, 0)
    t.setDate(t.getDate() - Math.round(debut - i * pas))
    return t.toISOString()
  })
  const historique = h.map((x, i) => ({ ...x, date: dates[i] })).reverse()
  return recaler({ ...d, creeLe: dates[0], majLe: dates[dates.length - 1], historique })
}

// Les dates des étapes (envoi en revue, validations, signature…) suivent celles de l'historique.
function recaler(d) {
  const quand = (re, qui) => d.historique.find((h) => re.test(h.texte) && (!qui || h.qui === qui))?.date
  const x = { ...d }
  const gagne = quand(/signé le call/)
  if (gagne) x.prospection = { ...x.prospection, gagneLe: jourLocal(gagne) }
  if (x.audit) {
    x.audit = { ...x.audit, soumisLe: x.audit.soumisLe && (quand(/revue technique/) || x.audit.soumisLe) }
    x.audit.retours = x.audit.retours.map((r) => ({ ...r, date: quand(/renvoyé l’audit/) || r.date }))
  }
  if (x.devis) {
    const validations = Object.fromEntries(Object.keys(x.devis.validations).map((id) => [id, quand(id === 'martin' ? /soumis le devis/ : /a validé le devis/, id) || x.devis.validations[id]]))
    x.devis = {
      ...x.devis,
      creeLe: quand(/validé l’audit/) || x.devis.creeLe,
      envoyeLe: x.devis.envoyeLe && (quand(/envoyé le devis/) || x.devis.envoyeLe),
      accepteLe: x.devis.accepteLe && (quand(/Contrat signé/) || x.devis.accepteLe),
      signeLe: x.devis.signeLe && (quand(/Contrat signé/) || x.devis.signeLe),
      validations,
    }
  }
  // Depuis quand l'état actuel dure : dernière étape franchie (les votes ne remettent pas le compteur à zéro).
  x.etatLe = d.historique.find((h) => h.type === 'etape' && !/a validé le devis|Devis validé à 3/.test(h.texte))?.date || x.creeLe
  if (x.delivery?.livreLe) x.delivery = { ...x.delivery, livreLe: jourLocal(quand(/livré le projet/) || x.delivery.livreLe) }
  return x
}

const verdict = (d, v) => ({ ...d, audit: { ...d.audit, propositions: d.audit.propositions.map((p, i) => ({ ...p, revue: { verdict: v[i] || 'ok', jours: p.jours, commentaire: v[i] === 'reserve' ? 'Dépend de l’accès à leur compte Stripe.' : v[i] === 'non' ? 'Hors de notre périmètre pour l’instant.' : '' } })) } })

export function donneesDemo() {
  const j = (n) => decalerJour(aujourdhui(), n)
  const base = (champs) => W.nouveauDossier(champs, 'nino')
  const dossiers = []
  let n = 0
  const numero = () => `D-${new Date().getFullYear()}-${String(++n).padStart(3, '0')}`

  // ── Prospection ──
  dossiers.push(dater(base({ nom: 'Yanis Benali', business: 'Benali Trading', niche: 'Trading', canal: 'Instagram', tailleCA: '40', contact: { email: '', telephone: '', instagram: '@yanis.trading' } }), 6, 6))
  dossiers.push(dater(base({ nom: 'Léo Garnier', business: 'Garnier Formation', niche: 'Marketing', canal: 'LinkedIn', tailleCA: '55', contact: { email: '', telephone: '', instagram: '@leo.garnier' } }), 0, 0))
  let d = base({ nom: 'Sarah Lemoine', business: 'Sarah Fit Club', niche: 'Fitness', canal: 'Instagram', tailleCA: '25', contact: { email: 'sarah@sarahfit.fr', telephone: '', instagram: '@sarahfitclub' } })
  d = W.changerStatutProspect(d, 'contacte', 'nino')
  dossiers.push(dater({ ...d, prospection: { ...d.prospection, relance: j(0), notes: 'Intéressée, veut en reparler avec son associé. Relancer en DM.' } }, 6, 2))
  d = base({ nom: 'Kévin Dubois', business: 'Immo Rentable', niche: 'Immobilier', canal: 'LinkedIn', tailleCA: '120', contact: { email: 'kevin@immorentable.fr', telephone: '06 12 34 56 78', instagram: '' } })
  d = W.changerStatutProspect(W.changerStatutProspect(d, 'contacte', 'nino'), 'call_prevu', 'nino')
  dossiers.push(dater({ ...d, prospection: { ...d.prospection, callLe: j(1), notes: '6 closers, 15 setters. Gros volume, CRM sur Google Sheets.' } }, 9, 1))
  d = base({ nom: 'Inès Moreau', business: 'Shop Masterclass', niche: 'E-commerce', canal: 'Recommandation', tailleCA: '80', contact: { email: 'ines@shopmasterclass.com', telephone: '', instagram: '@ines.ecom' } })
  d = W.changerStatutProspect(W.changerStatutProspect(W.changerStatutProspect(d, 'contacte', 'nino'), 'call_prevu', 'nino'), 'call_fait', 'nino')
  dossiers.push(dater({ ...d, prospection: { ...d.prospection, callLe: j(-1), relance: j(1), notes: 'Très chaude. Attend juste le feu vert de son comptable.' } }, 12, 1))
  d = base({ nom: 'Bastien Morel', business: 'Morel Crypto', niche: 'Crypto', canal: 'Cold email', tailleCA: '15' })
  dossiers.push(dater(W.perdre(W.changerStatutProspect(d, 'contacte', 'nino'), 'nino', 'Pas le budget pour l’instant, à recontacter en janvier'), 20, 14))

  // ── Audit en cours (Hugo) ──
  d = W.passerAudit(base({ nom: 'Thomas Girard', business: 'Girard Trading Academy', niche: 'Trading', canal: 'YouTube', tailleCA: '150', contact: { email: 'thomas@girard-academy.com', telephone: '06 22 33 44 55', instagram: '@thomasgirard' } }), 'nino')
  d = { ...d, audit: { ...d.audit, callLe: j(0), business: { ...d.audit.business, offre: 'Formation trading 12 semaines', prix: '2 497 €', caMensuel: '150', ventesMois: '60' }, equipe: { setters: 8, closers: 4, managers: 1, support: 1, notes: 'Un head of sales qui gère tout sur Notion.' } } }
  dossiers.push(dater(d, 5, 0))

  // ── Audit renvoyé par Martin ──
  d = W.passerAudit(base({ nom: 'Camille Roux', business: 'Roux Immo Club', niche: 'Immobilier', canal: 'Réseau', tailleCA: '90', contact: { email: 'camille@rouximmo.fr', telephone: '', instagram: '@camille.immo' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Club immobilier annuel', prix: '3 900 €', ca: '90', ventes: '23', setters: 5, closers: 2, outils: ['Google Sheets', 'Calendly', 'WhatsApp', 'Stripe'], leads: '900', show: '62 %', closing: '', panier: '3 900 €', douleurs: 'Aucune visibilité sur qui pose quels rendez-vous. Les commissions sont calculées à la main chaque fin de mois, avec des erreurs.', propositions: [prop('CRM setters', 'Tout le suivi des 5 setters au même endroit'), prop('Commissions automatiques', 'Fin des erreurs de paie')] }) }
  d = W.soumettreAudit(d, 'hugo')
  d = W.renvoyerAudit(d, 'martin', 'Il manque le taux de closing et le nombre de leads par setter : sans ça je ne peux pas dimensionner le CRM.')
  dossiers.push(dater(d, 11, 1))

  // ── Revue technique (Martin) ──
  d = W.passerAudit(base({ nom: 'Mehdi Haddad', business: 'Dropshipping Elite', niche: 'Dropshipping', canal: 'Instagram', tailleCA: '210', contact: { email: 'mehdi@dropelite.io', telephone: '07 11 22 33 44', instagram: '@mehdi.drop' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Accompagnement dropshipping 90 jours', prix: '1 997 €', ca: '210', ventes: '105', setters: 12, closers: 5, managers: 1, support: 2, outils: ['GoHighLevel', 'Calendly', 'Slack', 'Stripe', 'Skool'], leads: '2 400', show: '58 %', closing: '24 %', panier: '1 997 €', douleurs: 'GoHighLevel est mal configuré : les setters perdent des leads, personne ne sait qui a posé quoi. Les closers n’ont aucun tableau de bord.', propositions: [prop('CRM setters', 'Ne plus perdre un seul lead'), prop('CRM closers', 'Préparer chaque call en 30 secondes'), prop('Dashboard de pilotage', 'Voir le CA du jour en temps réel'), prop('Espace membre', 'Sortir de Skool, à leur image', 10)] }) }
  d = W.soumettreAudit(d, 'hugo')
  d = { ...d, audit: { ...d.audit, propositions: d.audit.propositions.map((p, i) => (i === 0 ? { ...p, revue: { verdict: 'ok', jours: 6, commentaire: '' } } : p)) } }
  dossiers.push(dater(d, 8, 0))

  // ── Devis en préparation (Martin) ──
  d = W.passerAudit(base({ nom: 'Julie Perrin', business: 'Perrin Coaching', niche: 'Développement perso', canal: 'Instagram', tailleCA: '70', contact: { email: 'julie@perrincoaching.fr', telephone: '', instagram: '@julie.perrin' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Coaching de groupe 6 mois', prix: '2 200 €', ca: '70', ventes: '32', setters: 4, closers: 2, outils: ['Notion', 'Calendly', 'Discord', 'Systeme.io'], leads: '700', show: '65 %', closing: '28 %', panier: '2 200 €', douleurs: 'Onboarding entièrement manuel : 2 h par nouvel élève. Les relances setters se font de mémoire.', propositions: [prop('Onboarding client automatisé', '2 h gagnées par vente'), prop('CRM setters', 'Relances automatiques')] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), ['ok', 'ok']), 'martin', numero())
  dossiers.push(dater(d, 14, 1))

  // ── Validation à 3 (Hugo n'a pas encore validé) ──
  d = W.passerAudit(base({ nom: 'Antoine Leroy', business: 'Leroy Business School', niche: 'Business en ligne', canal: 'LinkedIn', tailleCA: '320', contact: { email: 'antoine@leroy.school', telephone: '06 98 76 54 32', instagram: '@antoine.leroy' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Programme business en ligne', prix: '4 500 €', ca: '320', ventes: '71', setters: 18, closers: 7, managers: 2, support: 3, outils: ['HubSpot', 'iClosed', 'Slack', 'Stripe', 'Zapier / Make'], leads: '4 000', show: '55 %', closing: '22 %', panier: '4 500 €', douleurs: 'HubSpot coûte une fortune et l’équipe ne l’utilise pas. Le calcul des commissions de 25 personnes prend 2 jours par mois.', propositions: [prop('CRM setters', 'Remplacer HubSpot pour les setters'), prop('CRM closers', 'Un outil pensé pour le closing'), prop('Commissions automatiques', '2 jours gagnés par mois'), prop('Dashboard de pilotage', 'Classement en direct de l’équipe')] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), ['ok', 'ok', 'ok', 'reserve']), 'martin', numero())
  d = { ...d, devis: { ...d.devis, maintenance: 390, remise: 1000 } }
  d = W.voterDevis(W.soumettreDevis(d, 'martin'), 'nino')
  dossiers.push(dater(d, 18, 0))

  // ── Chez le client (Nino relance) ──
  d = W.passerAudit(base({ nom: 'Nora Belkacem', business: 'Crypto Mastery', niche: 'Crypto', canal: 'YouTube', tailleCA: '110', contact: { email: 'nora@cryptomastery.fr', telephone: '', instagram: '@nora.crypto' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Formation crypto + communauté', prix: '1 490 €', ca: '110', ventes: '74', setters: 6, closers: 3, outils: ['Airtable', 'Calendly', 'Discord', 'Stripe'], leads: '1 500', show: '60 %', closing: '26 %', panier: '1 490 €', douleurs: 'Les leads froids ne sont jamais recontactés : 6 mois de leads dorment dans Airtable.', propositions: [prop('Tunnel low ticket', 'Récupérer les leads perdus'), prop('CRM setters', 'Suivi des relances')] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), ['ok', 'ok']), 'martin', numero())
  d = W.envoyerDevis(W.voterDevis(W.voterDevis(W.soumettreDevis({ ...d, devis: { ...d.devis, maintenance: 290 } }, 'martin'), 'nino'), 'hugo'), 'martin')
  dossiers.push(dater(d, 22, 3))

  // ── Delivery en cours (Martin) ──
  d = W.passerAudit(base({ nom: 'Lucas Fontaine', business: 'Fontaine Mindset', niche: 'Développement perso', canal: 'Recommandation', tailleCA: '180', contact: { email: 'lucas@fontaine-mindset.com', telephone: '06 45 67 89 01', instagram: '@lucas.fontaine' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Accompagnement mindset premium', prix: '3 000 €', ca: '180', ventes: '60', setters: 9, closers: 4, managers: 1, outils: ['Google Sheets', 'Calendly', 'WhatsApp', 'Stripe', 'Skool'], leads: '1 800', show: '61 %', closing: '25 %', panier: '3 000 €', douleurs: 'Tout est sur Google Sheets, rien n’est fiable.', propositions: [prop('CRM setters', ''), prop('CRM closers', ''), prop('Dashboard de pilotage', ''), prop('Automatisations', '')] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), ['ok', 'ok', 'ok', 'ok']), 'martin', numero())
  d = W.signer(W.envoyerDevis(W.voterDevis(W.voterDevis(W.soumettreDevis({ ...d, devis: { ...d.devis, maintenance: 290 } }, 'martin'), 'nino'), 'hugo'), 'martin'), 'nino')
  d = { ...d, delivery: { ...d.delivery, debut: j(-16), livraisonPrevue: j(12), livrables: d.delivery.livrables.map((l, i) => ({ ...l, statut: ['livre', 'recette', 'en_cours', 'a_faire'][i] })), paiements: d.delivery.paiements.map((p, i) => (i === 0 ? { ...p, recuLe: j(-15) } : p)) } }
  dossiers.push(dater(d, 34, 2))

  // ── Livré ──
  d = W.passerAudit(base({ nom: 'Emma Caron', business: 'Caron Fit', niche: 'Fitness', canal: 'Instagram', tailleCA: '60', contact: { email: 'emma@caronfit.fr', telephone: '', instagram: '@emma.caronfit' } }), 'nino')
  d = { ...d, audit: auditComplet({ offre: 'Programme fitness 12 semaines', prix: '997 €', ca: '60', ventes: '60', setters: 3, closers: 2, outils: ['Notion', 'Calendly', 'Stripe'], leads: '900', show: '63 %', closing: '30 %', panier: '997 €', douleurs: 'Pas de suivi des setters.', propositions: [prop('CRM setters', ''), prop('Commissions automatiques', '')] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), ['ok', 'ok']), 'martin', numero())
  d = W.signer(W.envoyerDevis(W.voterDevis(W.voterDevis(W.soumettreDevis({ ...d, devis: { ...d.devis, maintenance: 190 } }, 'martin'), 'nino'), 'hugo'), 'martin'), 'nino')
  d = { ...d, delivery: { ...d.delivery, debut: j(-40), livraisonPrevue: j(-12), livrables: d.delivery.livrables.map((l) => ({ ...l, statut: 'livre' })), paiements: d.delivery.paiements.map((p, i) => ({ ...p, recuLe: j(i ? -12 : -39) })) } }
  dossiers.push(dater(W.livrer(d, 'martin'), 55, 12))

  // Commentaires d'équipe sur quelques dossiers.
  const commenter = (business, qui, texte, joursAvant) => {
    const i = dossiers.findIndex((x) => x.business === business)
    const date = new Date(Date.now() - joursAvant * 86400000 - 3600000).toISOString()
    dossiers[i] = { ...dossiers[i], historique: [{ id: uid('h'), date, qui, texte, type: 'commentaire' }, ...dossiers[i].historique] }
  }
  commenter('Leroy Business School', 'nino', 'Il veut démarrer avant la fin du mois, ils ont un lancement le 15.', 0.2)
  commenter('Crypto Mastery', 'nino', 'Je relance demain si pas de nouvelles, elle avait l’air chaude au téléphone.', 1)
  commenter('Perrin Coaching', 'hugo', 'Elle a insisté sur l’onboarding, c’est vraiment leur gros point de douleur.', 2)

  return { dossiers, compteurs: { devis: n } }
}
