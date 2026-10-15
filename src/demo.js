// Données de démonstration : un dossier à chaque étape du parcours, pour valider l'interface à trois.
// Les dossiers sont construits avec les vraies fonctions du parcours, puis leurs dates sont étalées dans le passé.
import { decalerJour, aujourdhui, jourLocal, uid } from './lib.js'
import { BLOCS, cleItem } from './trame.js'
import * as W from './workflow.js'

const lignes = (prefixe, liste, champs) => liste.map((x) => ({ id: uid(prefixe), ...Object.fromEntries(champs.map((k, i) => [k, x[i] ?? ''])) }))

// Un audit tel que Hugo le rend : toutes les cases couvertes, sauf les `manques`, notés en question ouverte.
function auditComplet({ chef, offres, volumes, sources, tunnel, equipe, outils, regles, besoins, recette, budget, lancement, depart, douleur, manques = [] }) {
  const a = W.auditVide()
  const coches = Object.fromEntries(BLOCS.flatMap((b) => b.items.map((i) => [cleItem(b.id, i.id), true])))
  manques.forEach(([cle]) => { coches[cle] = false })
  return {
    ...a,
    entretiens: { dirigeant: true, closer: true, setter: true, compta: true, ecrit: true },
    coches,
    questions: manques.map(([item, texte, aQui]) => ({ id: uid('q'), item, texte, aQui, reponse: '' })),
    notes: { douleurs: douleur, chiffres: 'Tout est dans un Google Sheet tenu à la main par le head of sales. Closing = ventes ÷ rendez-vous tenus ; les annulés ne comptent pas.' },
    fiche: {
      ...a.fiche, budget, lancement, dateDepart: depart, tunnel, sources,
      decideurDevis: chef, valideurRecette: chef, externes: 'Aucun',
      exclus: 'Les publicités, le contenu, l’hébergement des vidéos de formation.',
      offres: lignes('o', offres, ['offre', 'prix', 'paiement']),
      equipe: lignes('e', equipe, ['prenom', 'role', 'pays', 'langue', 'appareil']).map((e) => ({ ...e, langue: e.langue || 'Français', appareil: e.appareil || 'Les deux' })),
      volumes: { leads: volumes[0], rdv: volumes[1], ventes: volumes[2], ca: volumes[3] },
      decideurs: { commissions: chef, chiffres: chef, acces: chef, budget: chef },
    },
    besoins: besoins.map(([qui, besoin, pour, priorite = 'indispensable', preuve = 'Capture du Google Sheet']) => ({ id: uid('b'), qui, besoin, pour, priorite, preuve, revue: {} })),
    regles: lignes('r', regles, ['regle', 'exemple', 'validePar']),
    recette: lignes('c', recette, ['texte']),
    acces: lignes('a', outils.map((o) => [o, 'Pro', 'À vérifier', chef, chef, 'Au démarrage']), ['outil', 'abonnement', 'api', 'admin', 'cles', 'quand']),
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

// Martin donne son verdict aux besoins indispensables, dans l'ordre : [['ok', 6], ['reserve', 4]…].
const verdict = (d, v) => {
  let i = 0
  const besoins = d.audit.besoins.map((b) => {
    if (b.priorite !== 'indispensable') return b
    if (!v[i]) return b
    const [x, jours] = v[i++]
    return { ...b, revue: { verdict: x, jours: x === 'non' ? '' : String(jours), commentaire: x === 'reserve' ? 'Dépend de l’accès à leur compte Stripe.' : x === 'non' ? 'Hors de notre périmètre pour l’instant.' : '' } }
  })
  return { ...d, audit: { ...d.audit, besoins } }
}

const REGLES = (chef) => [
  ['10 % au closer, sur l’encaissé, versé le 5 du mois suivant', 'Vente 3 500 € en 3x, 1 000 € payés puis l’élève part : le closer touche 100 €', chef],
  ['30 € au setter par rendez-vous tenu', 'Rendez-vous annulé ou absent : 0 €. Deux setters sur un lead : le premier qui a posé le rendez-vous', chef],
  ['Remboursement sous 14 jours : commission reprise', 'Vente 2 000 € remboursée au jour 10 : 200 € retirés au closer le mois suivant', chef],
]
const RECETTE = [
  ['Chaque setter ne voit que ses leads et ses commissions'],
  ['Un paiement Stripe apparaît sur sa vente en moins d’une minute'],
  ['Le relevé de commissions du mois tombe juste sur un mois réel repris du Sheet'],
]

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
  d = { ...d, audit: { ...d.audit, callLe: j(0), entretiens: { dirigeant: true },
    coches: { 'business.offres': true, 'business.tunnel': true, 'business.volumes': true, 'business.sources': true, 'personnes.equipe': true, 'personnes.langue': true },
    questions: [{ id: uid('q'), item: 'personnes.voir_faire', texte: 'Un closer doit-il voir les ventes des autres closers ?', aQui: 'Thomas', reponse: '' }],
    notes: { business: 'Gros volume YouTube, 60 ventes par mois, tout passe par un head of sales qui gère sur Notion.' },
    fiche: { ...d.audit.fiche, offres: lignes('o', [['Formation trading 12 semaines', '2 497 €', '1x ou 4x'], ['Coaching 1:1', '6 000 €', '1x ou 6x']], ['offre', 'prix', 'paiement']), volumes: { leads: '1 800', rdv: '260', ventes: '60', ca: '150 k€' }, sources: ['YouTube', 'Instagram', 'Setting'], tunnel: 'Vidéo YouTube → page de capture → formulaire → rendez-vous Calendly avec un setter → call closer → paiement Stripe → accès Skool',
      equipe: lignes('e', [['Thomas', 'Dirigeant', 'France', 'Français', 'Les deux'], ['Rayan', 'Head of sales', 'France', 'Français', 'Ordinateur'], ['Ilyes', 'Closer', 'Dubaï (UTC+4)', 'Français', 'Ordinateur']], ['prenom', 'role', 'pays', 'langue', 'appareil']) } } }
  dossiers.push(dater(d, 5, 0))

  // ── Audit renvoyé par Martin ──
  d = W.passerAudit(base({ nom: 'Camille Roux', business: 'Roux Immo Club', niche: 'Immobilier', canal: 'Réseau', tailleCA: '90', contact: { email: 'camille@rouximmo.fr', telephone: '', instagram: '@camille.immo' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Camille (dirigeante)', budget: '6 à 8 k€', lancement: '1er décembre, nouvelle promo', depart: j(-14), offres: [['Club immobilier annuel', '3 900 €', '1x, 3x ou 12x']], volumes: ['900', '140', '23', '90 k€'], sources: ['Instagram', 'Recommandation', 'Setting'], tunnel: 'Post Instagram → DM setter → rendez-vous Calendly → call closer → paiement Stripe → onboarding WhatsApp',
    equipe: [['Camille', 'Dirigeante', 'France'], ['Nadia', 'Setter', 'Maroc (UTC+1)', 'Français', 'Téléphone'], ['Paul', 'Closer', 'France']], outils: ['Google Sheets', 'Calendly', 'WhatsApp', 'Stripe'], regles: REGLES('Camille'), recette: RECETTE,
    douleur: 'Aucune visibilité sur qui pose quels rendez-vous. Les commissions sont calculées à la main chaque fin de mois, avec des erreurs.',
    besoins: [['Camille', 'savoir qui a posé chaque rendez-vous', 'payer les bons setters', 'indispensable', 'Onglet « Setting » du Sheet'], ['La compta', 'un relevé des commissions de chaque setter et closer', 'ne plus recalculer à la main en fin de mois', 'indispensable', 'Le relevé d’août, avec 3 erreurs'], ['Un closer', 'la fiche du lead avant chaque call', 'préparer le call en 30 secondes', 'plus_tard', 'Message WhatsApp de Paul']],
    manques: [['argent.cas', 'Un setter qui pose un rendez-vous annulé puis reprogrammé, il touche quoi ?', 'Camille']] }) }
  d = W.soumettreAudit(d, 'hugo')
  d = W.renvoyerAudit(d, 'martin', 'La règle du rendez-vous annulé puis reprogrammé est encore en question : sans elle je ne peux pas chiffrer les commissions. Et il manque l’export du Sheet en preuve.')
  dossiers.push(dater(d, 11, 1))

  // ── Revue technique (Martin) ──
  d = W.passerAudit(base({ nom: 'Mehdi Haddad', business: 'Dropshipping Elite', niche: 'Dropshipping', canal: 'Instagram', tailleCA: '210', contact: { email: 'mehdi@dropelite.io', telephone: '07 11 22 33 44', instagram: '@mehdi.drop' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Mehdi (dirigeant)', budget: '12 à 15 k€', lancement: 'Mi-novembre, avant le Black Friday', depart: j(-14), offres: [['Accompagnement dropshipping 90 jours', '1 997 €', '1x ou 3x'], ['Upsell 1:1', '1 500 €', '1x']], volumes: ['2 400', '380', '105', '210 k€'], sources: ['Ads', 'Instagram', 'TikTok', 'Setting'], tunnel: 'Pub Meta → VSL → formulaire → rendez-vous GoHighLevel → call closer → paiement Stripe → accès Skool',
    equipe: [['Mehdi', 'Dirigeant', 'France'], ['Sofiane', 'Head of sales', 'France'], ['Yanis', 'Closer', 'Canada (UTC-5)'], ['Inès', 'Setter', 'Tunisie (UTC+1)', 'Français', 'Téléphone'], ['Linda', 'Compta', 'France', 'Français', 'Ordinateur']], outils: ['GoHighLevel', 'Calendly', 'Slack', 'Stripe', 'Skool'], regles: REGLES('Mehdi'), recette: RECETTE,
    douleur: 'GoHighLevel est mal configuré : les setters perdent des leads, personne ne sait qui a posé quoi. Les closers n’ont aucun tableau de bord.',
    besoins: [['Un setter', 'voir ses leads à relancer du jour', 'ne plus en perdre', 'indispensable', 'Export GoHighLevel : 312 leads sans suite en septembre'], ['Un closer', 'ses calls du jour avec la fiche du lead', 'préparer chaque call', 'indispensable', 'Capture de l’agenda'], ['Mehdi', 'le CA encaissé du jour et le closing par closer, sur les rendez-vous tenus', 'savoir qui coacher', 'indispensable', 'Onglet « Stats » du Sheet'], ['Les élèves', 'un espace membre à leur image', 'sortir de Skool', 'plus_tard', 'Message de Mehdi'], ['Mehdi', 'des publicités Meta gérées par l’outil', 'gagner du temps', 'hors', '']] }) }
  d = W.soumettreAudit(d, 'hugo')
  d = verdict(d, [['ok', 6]])
  dossiers.push(dater(d, 8, 0))

  // ── Devis en préparation (Martin) ──
  d = W.passerAudit(base({ nom: 'Julie Perrin', business: 'Perrin Coaching', niche: 'Développement perso', canal: 'Instagram', tailleCA: '70', contact: { email: 'julie@perrincoaching.fr', telephone: '', instagram: '@julie.perrin' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Julie (dirigeante)', budget: '5 k€', lancement: 'Janvier, rentrée de la promo', depart: j(-20), offres: [['Coaching de groupe 6 mois', '2 200 €', '1x ou 6x']], volumes: ['700', '110', '32', '70 k€'], sources: ['Instagram', 'Setting'], tunnel: 'Story Instagram → DM setter → rendez-vous Calendly → call closer → paiement Systeme.io → onboarding manuel Discord',
    equipe: [['Julie', 'Dirigeante', 'France'], ['Léa', 'Setter', 'France', 'Français', 'Téléphone'], ['Hakim', 'Closer', 'Belgique']], outils: ['Notion', 'Calendly', 'Discord', 'Systeme.io'], regles: REGLES('Julie'), recette: RECETTE,
    douleur: 'Onboarding entièrement manuel : 2 h par nouvel élève. Les relances setters se font de mémoire.',
    besoins: [['Julie', 'que chaque nouvel élève reçoive ses accès et son premier rendez-vous sans intervention', 'gagner 2 h par vente', 'indispensable', 'Procédure Notion de 14 étapes'], ['Un setter', 'la liste des relances du jour', 'ne plus relancer de mémoire', 'indispensable', 'Capture du Notion des setters']] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), [['ok', 4], ['ok', 5]]), 'martin', numero())
  dossiers.push(dater(d, 14, 1))

  // ── Validation à 3 (Hugo n'a pas encore validé) ──
  d = W.passerAudit(base({ nom: 'Antoine Leroy', business: 'Leroy Business School', niche: 'Business en ligne', canal: 'LinkedIn', tailleCA: '320', contact: { email: 'antoine@leroy.school', telephone: '06 98 76 54 32', instagram: '@antoine.leroy' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Antoine (dirigeant)', budget: '15 à 20 k€', lancement: 'Le 15, lancement de la nouvelle offre', depart: j(-30), offres: [['Programme business en ligne', '4 500 €', '1x, 3x ou 6x'], ['Mastermind', '12 000 €', '1x ou 2x']], volumes: ['4 000', '620', '71', '320 k€'], sources: ['Ads', 'YouTube', 'Setting', 'Partenaires'], tunnel: 'Pub Meta et YouTube → webinaire → formulaire → rendez-vous iClosed → call closer → paiement Stripe → onboarding Slack',
    equipe: [['Antoine', 'Dirigeant', 'France'], ['Karim', 'Head of sales', 'France'], ['Sami', 'Closer', 'Dubaï (UTC+4)'], ['Mélanie', 'Setter', 'Portugal (UTC+0)', 'Français', 'Téléphone'], ['Chloé', 'Compta', 'France', 'Français', 'Ordinateur']], outils: ['HubSpot', 'iClosed', 'Slack', 'Stripe', 'Zapier / Make'], regles: REGLES('Antoine'), recette: RECETTE,
    douleur: 'HubSpot coûte une fortune et l’équipe ne l’utilise pas. Le calcul des commissions de 25 personnes prend 2 jours par mois.',
    besoins: [['Un setter', 'ses leads, ses relances et ses rendez-vous posés au même endroit', 'remplacer HubSpot', 'indispensable', 'Facture HubSpot + capture'], ['Un closer', 'ses calls du jour à la bonne heure, avec l’historique du lead', 'préparer chaque call', 'indispensable', 'Agenda iClosed'], ['La compta', 'le relevé de commissions de chacun, chaque semaine', 'ne plus y passer 2 jours par mois', 'indispensable', 'Le fichier de calcul de septembre'], ['Antoine', 'le classement de l’équipe en direct', 'piloter les ventes', 'indispensable', 'Onglet « Stats » du Sheet'], ['Le partenaire', 'voir uniquement les ventes de sa source', 'suivre sa commission', 'plus_tard', 'Message d’Antoine']] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), [['ok', 6], ['ok', 6], ['ok', 3], ['reserve', 4]]), 'martin', numero())
  d = { ...d, devis: { ...d.devis, maintenance: 390, remise: 1000 } }
  d = W.voterDevis(W.soumettreDevis(d, 'martin'), 'nino')
  dossiers.push(dater(d, 18, 0))

  // ── Chez le client (Nino relance) ──
  d = W.passerAudit(base({ nom: 'Nora Belkacem', business: 'Crypto Mastery', niche: 'Crypto', canal: 'YouTube', tailleCA: '110', contact: { email: 'nora@cryptomastery.fr', telephone: '', instagram: '@nora.crypto' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Nora (dirigeante)', budget: '7 k€', lancement: 'Dès que possible', depart: j(-25), offres: [['Formation crypto + communauté', '1 490 €', '1x ou 3x']], volumes: ['1 500', '230', '74', '110 k€'], sources: ['YouTube', 'Setting'], tunnel: 'Vidéo YouTube → formulaire → rendez-vous Calendly → call closer → paiement Stripe → accès Discord',
    equipe: [['Nora', 'Dirigeante', 'France'], ['Bilal', 'Setter', 'Algérie (UTC+1)', 'Français', 'Téléphone'], ['Marc', 'Closer', 'Suisse']], outils: ['Airtable', 'Calendly', 'Discord', 'Stripe'], regles: REGLES('Nora'), recette: RECETTE,
    douleur: 'Les leads froids ne sont jamais recontactés : 6 mois de leads dorment dans Airtable.',
    besoins: [['Nora', 'une offre d’entrée envoyée aux leads froids', 'récupérer les leads perdus', 'indispensable', 'Export Airtable : 4 200 leads sans suite'], ['Un setter', 'la liste de ses relances du jour', 'ne plus en oublier', 'indispensable', 'Capture Airtable']] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), [['ok', 5], ['ok', 6]]), 'martin', numero())
  d = W.envoyerDevis(W.voterDevis(W.voterDevis(W.soumettreDevis({ ...d, devis: { ...d.devis, maintenance: 290 } }, 'martin'), 'nino'), 'hugo'), 'martin')
  dossiers.push(dater(d, 22, 3))

  // ── Delivery en cours (Martin) ──
  d = W.passerAudit(base({ nom: 'Lucas Fontaine', business: 'Fontaine Mindset', niche: 'Développement perso', canal: 'Recommandation', tailleCA: '180', contact: { email: 'lucas@fontaine-mindset.com', telephone: '06 45 67 89 01', instagram: '@lucas.fontaine' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Lucas (dirigeant)', budget: '12 k€', lancement: 'Avant la fin du mois prochain', depart: j(-40), offres: [['Accompagnement mindset premium', '3 000 €', '1x ou 3x']], volumes: ['1 800', '290', '60', '180 k€'], sources: ['Instagram', 'Recommandation', 'Setting'], tunnel: 'Instagram → DM setter → rendez-vous Calendly → call closer → paiement Stripe → onboarding WhatsApp + Skool',
    equipe: [['Lucas', 'Dirigeant', 'France'], ['Anaïs', 'Setter', 'France', 'Français', 'Téléphone'], ['Romain', 'Closer', 'France']], outils: ['Google Sheets', 'Calendly', 'WhatsApp', 'Stripe', 'Skool'], regles: REGLES('Lucas'), recette: RECETTE,
    douleur: 'Tout est sur Google Sheets, rien n’est fiable.',
    besoins: [['Un setter', 'ses leads et ses relances du jour', 'ne plus travailler sur le Sheet', 'indispensable'], ['Un closer', 'ses calls du jour et l’issue de chaque call', 'suivre ses ventes', 'indispensable'], ['Lucas', 'le CA encaissé et le closing par closer', 'piloter l’équipe', 'indispensable'], ['Lucas', 'une alerte WhatsApp à chaque vente', 'suivre en direct', 'indispensable', 'Message de Lucas']] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), [['ok', 6], ['ok', 6], ['ok', 4], ['ok', 2]]), 'martin', numero())
  d = W.signer(W.envoyerDevis(W.voterDevis(W.voterDevis(W.soumettreDevis({ ...d, devis: { ...d.devis, maintenance: 290 } }, 'martin'), 'nino'), 'hugo'), 'martin'), 'nino')
  d = { ...d, delivery: { ...d.delivery, debut: j(-16), livraisonPrevue: j(12), livrables: d.delivery.livrables.map((l, i) => ({ ...l, statut: ['livre', 'recette', 'en_cours', 'a_faire'][i] })), paiements: d.delivery.paiements.map((p, i) => (i === 0 ? { ...p, recuLe: j(-15) } : p)) } }
  dossiers.push(dater(d, 34, 2))

  // ── Livré ──
  d = W.passerAudit(base({ nom: 'Emma Caron', business: 'Caron Fit', niche: 'Fitness', canal: 'Instagram', tailleCA: '60', contact: { email: 'emma@caronfit.fr', telephone: '', instagram: '@emma.caronfit' } }), 'nino')
  d = { ...d, audit: auditComplet({ chef: 'Emma (dirigeante)', budget: '5 k€', lancement: 'Pas de date fixe', depart: j(-60), offres: [['Programme fitness 12 semaines', '997 €', '1x ou 2x']], volumes: ['900', '150', '60', '60 k€'], sources: ['Instagram', 'TikTok'], tunnel: 'TikTok et Instagram → formulaire → rendez-vous Calendly → call closer → paiement Stripe → accès à l’app',
    equipe: [['Emma', 'Dirigeante', 'France'], ['Jade', 'Setter', 'France', 'Français', 'Téléphone'], ['Tom', 'Closer', 'France']], outils: ['Notion', 'Calendly', 'Stripe'], regles: REGLES('Emma'), recette: RECETTE,
    douleur: 'Pas de suivi des setters.',
    besoins: [['Emma', 'voir l’activité de chaque setter', 'savoir qui travaille', 'indispensable'], ['La compta', 'les commissions calculées chaque semaine', 'payer sans erreur', 'indispensable']] }) }
  d = W.validerAudit(verdict(W.soumettreAudit(d, 'hugo'), [['ok', 6], ['ok', 3]]), 'martin', numero())
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
