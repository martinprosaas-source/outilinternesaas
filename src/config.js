// Réglages de l'outil : nom (provisoire), équipe, parcours d'un dossier, listes de choix.

export const NOM = 'atelier'

// Les trois associés. Le rôle décide de l'étape dont chacun est responsable.
// Chacun a sa couleur : on voit d'un coup d'œil qui a la balle. Le Cobalt reste réservé à « à toi de jouer ».
export const MEMBRES = [
  { id: 'nino', nom: 'Nino', role: 'prospection', titre: 'Prospection & closing', couleur: '#7048E8', fond: '#ECE6FF' },
  { id: 'hugo', nom: 'Hugo', role: 'audit', titre: 'Audits', couleur: '#13875A', fond: '#DDF3E8' },
  { id: 'martin', nom: 'Martin', role: 'dev', titre: 'Dev, devis & delivery', couleur: '#B0369C', fond: '#F8E1F3' },
]
export const membre = (id) => MEMBRES.find((m) => m.id === id)

// Le parcours d'un dossier, dans l'ordre. `qui` = rôle responsable (« tous » = validation à trois).
export const ETAPES = [
  { id: 'prospect', label: 'Prospection', court: 'Prospect', qui: 'prospection' },
  { id: 'audit', label: 'Audit', court: 'Audit', qui: 'audit' },
  { id: 'revue', label: 'Revue technique', court: 'Revue', qui: 'dev' },
  { id: 'devis', label: 'Devis', court: 'Devis', qui: 'dev' },
  { id: 'validation', label: 'Validation à 3', court: 'Validation', qui: 'tous' },
  { id: 'envoye', label: 'Chez le client', court: 'Envoyé', qui: 'prospection' },
  { id: 'delivery', label: 'Delivery', court: 'Delivery', qui: 'dev' },
  { id: 'livre', label: 'Livré', court: 'Livré', qui: null },
]
// Les 4 phases que tout le monde a en tête. Les étapes ci-dessus sont des états à l'intérieur.
export const PHASES = [
  { id: 'prospection', label: 'Prospection', etapes: ['prospect'], qui: 'nino', icone: 'prospection' },
  { id: 'audit', label: 'Audit', etapes: ['audit', 'revue'], qui: 'hugo', icone: 'audits' },
  { id: 'devis', label: 'Devis', etapes: ['devis', 'validation', 'envoye'], qui: 'martin', icone: 'devis' },
  { id: 'delivery', label: 'Delivery', etapes: ['delivery', 'livre'], qui: 'martin', icone: 'delivery' },
]
export const phaseDe = (etapeId) => PHASES.find((p) => p.etapes.includes(etapeId)) || PHASES[0]

// Suivi : un dossier qui attend passe en orange puis en rouge (en jours). Réglable par étape.
export const DELAIS = { orange: 2, rouge: 5 }
export const DELAIS_PAR_ETAPE = {} // ex. { envoye: { orange: 3, rouge: 7 } }
export const delais = (etapeId) => ({ ...DELAIS, ...DELAIS_PAR_ETAPE[etapeId] })

export const etape = (id) => ETAPES.find((e) => e.id === id) || { id, label: 'Perdu', court: 'Perdu', qui: null }
export const rangEtape = (id) => ETAPES.findIndex((e) => e.id === id)

// Statuts de prospection (avant le passage à l'audit).
export const STATUTS_PROSPECT = [
  { id: 'a_contacter', label: 'À contacter' },
  { id: 'contacte', label: 'Contacté' },
  { id: 'call_prevu', label: 'Call prévu' },
  { id: 'call_fait', label: 'Call fait' },
]

export const CANAUX = ['Instagram', 'LinkedIn', 'YouTube', 'Réseau', 'Recommandation', 'Cold email', 'Événement']
export const NICHES = ['Business en ligne', 'Trading', 'Immobilier', 'E-commerce', 'Fitness', 'Développement perso', 'Dropshipping', 'Marketing', 'Crypto', 'Autre']

export const OUTILS = ['Google Sheets', 'Notion', 'Airtable', 'HubSpot', 'GoHighLevel', 'Close', 'iClosed', 'Calendly', 'Slack', 'Discord', 'WhatsApp', 'Stripe', 'Systeme.io', 'Skool', 'Zapier / Make', 'ClickFunnels']

// Ce qu'on livre le plus souvent : Hugo l'ajoute à l'audit d'un clic, l'estimation sert de point de départ à la revue.
export const CATALOGUE = [
  { titre: 'CRM setters', description: 'Leads, relances, rendez-vous posés et commissions de chaque setter.', jours: 6 },
  { titre: 'CRM closers', description: 'Calls du jour, fiches prospect, issue du call et suivi des paiements.', jours: 6 },
  { titre: 'Dashboard de pilotage', description: 'CA, taux de show, taux de closing, classement de l’équipe en temps réel.', jours: 4 },
  { titre: 'Commissions automatiques', description: 'Calcul et relevé des commissions setters et closers, chaque semaine.', jours: 3 },
  { titre: 'Espace membre', description: 'Formation, ressources et suivi des élèves, aux couleurs de l’infopreneur.', jours: 8 },
  { titre: 'Onboarding client automatisé', description: 'Paiement → accès → message de bienvenue → premier rendez-vous, sans intervention.', jours: 4 },
  { titre: 'Page de vente', description: 'Page de vente rapide, branchée au paiement et au CRM.', jours: 4 },
  { titre: 'Tunnel low ticket', description: 'Offre d’entrée pour récupérer les leads perdus et remplir l’agenda des closers.', jours: 5 },
  { titre: 'Automatisations', description: 'Notifications Slack / WhatsApp, synchronisation des outils existants.', jours: 2 },
]

// Tarifs par défaut du devis (modifiables dans chaque devis).
export const TARIFS = { tjm: 550, acompte: 40, maintenance: 290 }

export const STATUTS_LIVRABLE = [
  { id: 'a_faire', label: 'À faire' },
  { id: 'en_cours', label: 'En cours' },
  { id: 'recette', label: 'En recette' },
  { id: 'livre', label: 'Livré' },
]
