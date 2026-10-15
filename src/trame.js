// La trame d'audit d'un écosystème infopreneur : ce que Hugo couvre, et ce qu'il rend à Martin.
// Un bon audit permet à Martin de chiffrer puis de développer sans reparler au client.

export const REGLES_OR = [
  { titre: 'Des faits, pas des solutions', texte: 'Noter ce que le client fait et ce qui lui manque. Ne promettre ni écran ni fonctionnalité : Martin décide comment le faire, et c’est ce qui fixe le prix.' },
  { titre: 'Une preuve pour chaque affirmation', texte: '« On suit le closing » ne suffit pas : il faut la capture du Google Sheet, la formule utilisée et un mois de vrais chiffres.' },
  { titre: 'Chaque règle avec un exemple chiffré', texte: '« 10 % de commission » devient : vente à 3 500 €, 1 000 € payés, l’élève part, le closer touche combien ?' },
  { titre: 'Les cas particuliers d’abord', texte: 'Remboursement, départ, upsell, deux closers sur un même lead, paiement en plusieurs fois, virement, doublon.' },
  { titre: 'Un décideur nommé par sujet', texte: 'Commissions, chiffres, accès, budget : sans nom, l’équipe change les règles après la livraison.' },
  { titre: 'Ce qui n’est pas dit est listé', texte: 'Une réponse manquante devient une question ouverte, jamais une supposition.' },
]

// En pratique : un appel d'une heure avec le dirigeant, 30 minutes avec une personne de chaque rôle, puis les pièces par écrit.
export const ENTRETIENS = [
  { id: 'dirigeant', label: 'Le dirigeant', duree: '1 h' },
  { id: 'closer', label: 'Un closer', duree: '30 min' },
  { id: 'setter', label: 'Un setter', duree: '30 min' },
  { id: 'compta', label: 'La compta', duree: '30 min' },
  { id: 'ecrit', label: 'Pièces par écrit', duree: '' },
]

export const PRIORITES = [
  { id: 'indispensable', label: 'Indispensable', court: 'Lancement' },
  { id: 'plus_tard', label: 'Plus tard', court: 'Plus tard' },
  { id: 'hors', label: 'Hors projet', court: 'Hors projet' },
]

export const SUJETS_DECISION = [
  { id: 'commissions', label: 'Commissions' },
  { id: 'chiffres', label: 'Chiffres' },
  { id: 'acces', label: 'Accès' },
  { id: 'budget', label: 'Budget' },
]

// Les 9 blocs. Un bloc est terminé quand chaque case est cochée ou notée en question ouverte.
// `piege` : ce qui est arrivé après le lancement sur EcomBoss, faute de cette question.
export const BLOCS = [
  {
    id: 'business', court: 'Business', titre: 'Le business en une page', pieces: 'Page de vente, grille des offres et des prix',
    items: [
      { id: 'offres', texte: 'Les offres vendues, leur prix, leurs options de paiement (ex. Collectif, Individuel, 1:1)' },
      { id: 'tunnel', texte: 'Le tunnel du début à la fin : pub ou contenu → page → formulaire → rendez-vous → appel → paiement → onboarding → accompagnement' },
      { id: 'volumes', texte: 'Les volumes : leads, rendez-vous, ventes et chiffre d’affaires par mois' },
      { id: 'sources', texte: 'Les sources de leads (Ads, TikTok, Instagram, YouTube, setting, recommandation, partenaires)' },
    ],
  },
  {
    id: 'personnes', court: 'Rôles', titre: 'Les personnes et les rôles', pieces: 'La liste de l’équipe',
    items: [
      { id: 'equipe', texte: 'La liste de l’équipe : prénom, rôle, pays (fuseau horaire)', piege: 'Des closers à l’étranger voyaient leurs rendez-vous à la mauvaise heure.' },
      { id: 'voir_faire', texte: 'Pour chaque rôle : ce qu’il doit voir, ce qu’il fait chaque jour, ce qu’il ne doit pas voir (les chiffres des autres, l’argent)', piege: 'Le module Setting a été ajouté après le lancement.' },
      { id: 'externes', texte: 'Les personnes extérieures qui auront un accès (partenaire, apporteur d’affaires, coach)', piege: 'Un partenaire externe a eu besoin d’un accès limité à sa source.' },
      { id: 'comptes', texte: 'Les arrivées et départs fréquents ? Qui crée et supprime les comptes ?' },
      { id: 'langue', texte: 'La langue de l’interface pour chaque personne' },
      { id: 'appareil', texte: 'L’appareil de chaque rôle : ordinateur, téléphone, les deux' },
      { id: 'decideurs', texte: 'Un décideur nommé par sujet : commissions, chiffres, accès, budget' },
    ],
  },
  {
    id: 'outils', court: 'Outils', titre: 'Les outils et les accès', pieces: 'Liste des abonnements, captures des réglages',
    items: [
      { id: 'liste', texte: 'Chaque outil et son abonnement : agenda (iClosed, Calendly), paiement (Whop, Stripe, virement), enregistrement d’appels (Fathom), pub (Meta), tableur, CRM' },
      { id: 'api', texte: 'Pour chaque outil : une API existe-t-elle sur leur abonnement ? Qui en est l’administrateur ?' },
      { id: 'identifiants', texte: 'Les identifiants de chaque personne dans ces outils (un closer s’appelle-t-il pareil partout ?)' },
      { id: 'cles', texte: 'Qui donnera les clés d’accès, et quand' },
      { id: 'notifications', texte: 'Les notifications attendues : quel événement, pour qui, sur quel canal (WhatsApp, Slack, e-mail)' },
    ],
  },
  {
    id: 'argent', court: 'Argent', titre: 'L’argent', pieces: 'Exemples de paiements réels, grille de commissions',
    items: [
      { id: 'moyens', texte: 'Les moyens de paiement et leur part (Whop, Stripe, virement, Revolut)' },
      { id: 'devise', texte: 'La devise de chaque vente, et s’il faut tout convertir dans une seule devise' },
      { id: 'echeanciers', texte: 'Les échéanciers : nombre de mensualités, premier versement plus gros, report possible ?' },
      { id: 'commissions', texte: 'La commission de chaque rôle (closer, setter, responsable) : sur le contracté ou l’encaissé, et quand elle est due', piege: 'La commission des setters a été ajoutée après le lancement.' },
      { id: 'cas', texte: 'Un exemple chiffré pour chaque cas : remboursement, élève qui part en cours de route, upsell, deux closers sur un lead, recommandation, vente d’un mois antérieur payée ce mois-ci', piege: 'L’élève qui part, l’upsell, les binômes et les recommandations sont arrivés après coup.' },
      { id: 'validation', texte: 'Qui valide qu’un paiement est bien arrivé (compta ?) et avec quelle preuve', piege: 'La compta voulait un paiement par versement et plusieurs preuves par paiement : 30 min avec elle l’auraient montré.' },
    ],
  },
  {
    id: 'chiffres', court: 'Chiffres', titre: 'Les chiffres suivis aujourd’hui', pieces: 'Capture et export du tableur actuel',
    items: [
      { id: 'tableur', texte: 'Le tableur ou le tableau de bord actuel (capture + export)' },
      { id: 'definitions', texte: 'La définition exacte de chaque chiffre : closing = ventes ÷ rendez-vous tenus, ou pris ? Un annulé compte-t-il ?', piege: 'La règle des annulés a changé le premier jour.' },
      { id: 'statuts', texte: 'Tous les statuts possibles d’un lead (à traiter, follow-up, gagné, perdu, annulé…) et qui les change', piege: 'Les statuts de follow-up ont changé le premier jour.' },
      { id: 'manquants', texte: 'Les chiffres qu’ils voudraient avoir et n’ont pas' },
    ],
  },
  {
    id: 'douleurs', court: 'Douleurs', titre: 'Les douleurs', pieces: 'Un exemple récent pour chaque problème',
    items: [
      { id: 'top3', texte: 'Les trois problèmes qui leur coûtent le plus aujourd’hui, avec un exemple récent' },
      { id: 'une_chose', texte: '« Si l’outil ne faisait qu’une seule chose, ce serait quoi ? »' },
      { id: 'pertes', texte: 'Ce qui se perd aujourd’hui : leads oubliés, paiements non suivis, commissions contestées' },
    ],
  },
  {
    id: 'depart', court: 'Départ', titre: 'Le point de départ', pieces: 'Le fichier d’historique à reprendre',
    items: [
      { id: 'date', texte: 'À partir de quelle date les chiffres de l’outil commencent', piege: 'La date de départ a changé deux fois (9 octobre, puis 1er octobre).' },
      { id: 'historique', texte: 'L’historique à reprendre : quoi, combien de lignes, dans quel fichier (récupérer le fichier)', piege: '820 rendez-vous et 25 ventes repris d’un Excel après coup.' },
      { id: 'en_cours', texte: 'Les ventes en cours dont les mensualités continuent de tomber', piege: 'Les mensualités des ventes d’avant le lancement n’avaient pas de dossier.' },
    ],
  },
  {
    id: 'donnees', court: 'Données', titre: 'Les données et la sécurité', pieces: 'Exigences écrites du client, s’il y en a',
    items: [
      { id: 'perso', texte: 'Les données personnelles que l’outil contiendra (élèves, leads, montants payés)' },
      { id: 'hebergement', texte: 'Les exigences d’hébergement ou de confidentialité du client' },
      { id: 'export', texte: 'Qui a le droit d’exporter ou de supprimer des données' },
    ],
  },
  {
    id: 'perimetre', court: 'Périmètre', titre: 'Le périmètre', pieces: 'Le périmètre confirmé par écrit',
    items: [
      { id: 'classement', texte: 'Chaque besoin classé : Indispensable au lancement, Plus tard ou Hors projet' },
      { id: 'lancement', texte: 'La date de lancement souhaitée et ce qui la rend fixe' },
      { id: 'budget', texte: 'Le budget envisagé, et la personne qui valide le devis et paie' },
      { id: 'recette', texte: 'Les critères de recette : ce qui doit marcher pour que la livraison soit acceptée, et qui la valide côté client' },
      { id: 'apres', texte: 'L’après-lancement : qui contacte le support, la maintenance attendue, le volume d’ajustements par mois' },
      { id: 'exclus', texte: 'Ce qui est explicitement exclu, écrit noir sur blanc' },
    ],
  },
]

export const bloc = (id) => BLOCS.find((b) => b.id === id)
export const cleItem = (blocId, itemId) => `${blocId}.${itemId}`
export const itemDe = (cle) => {
  const [b, i] = String(cle || '').split('.')
  const x = bloc(b)
  return x ? { bloc: x, numero: BLOCS.indexOf(x) + 1, item: x.items.find((y) => y.id === i) } : null
}

export const LANGUES = ['Français', 'Anglais', 'Espagnol']
export const APPAREILS = ['Ordinateur', 'Téléphone', 'Les deux']
export const API = ['Oui', 'Non', 'À vérifier']
export const SOURCES = ['Ads', 'TikTok', 'Instagram', 'YouTube', 'Setting', 'Recommandation', 'Partenaires']
