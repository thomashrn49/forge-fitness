# Mettre FORGE sur ton téléphone (gratuit)

Seul le **code** de l’app est hébergé sur Cloudflare Pages. Tes séances, pesées et records restent **uniquement dans ton téléphone**.

## Étape 1 — L’app est déjà en ligne

FORGE est hébergée gratuitement sur **Cloudflare Pages**, à l’adresse **https://forgecoachfitness.pages.dev**. Le site est relié au dépôt GitHub : chaque mise à jour poussée sur GitHub est publiée automatiquement en 1 à 2 minutes.

## Étape 2 — Installer l’app

### iPhone / iPad
1. Ouvre **https://forgecoachfitness.pages.dev** dans **Safari** (obligatoire, pas Chrome).
2. Touche **Partager** (carré avec une flèche vers le haut).
3. Choisis **« Sur l’écran d’accueil »** → **Ajouter**.
4. Ouvre FORGE depuis l’icône orange.

### Android
1. Ouvre **https://forgecoachfitness.pages.dev** dans **Chrome**.
2. Touche **Installer** dans la bannière, ou menu **⋮ → Installer l’application**.
3. FORGE apparaît dans tes applications.

Ouvre l’app une première fois avec du réseau : elle se télécharge entièrement et fonctionne ensuite **hors ligne**.

## Mettre à jour l’app plus tard

Rien à faire de ton côté : chaque push sur GitHub publie la nouvelle version. Sur le téléphone, l’app affiche **« Nouvelle version disponible »** → **Mettre à jour**. Tes données sont conservées.

## Tes données : comment elles sont protégées

- **Enregistrement automatique** à chaque action (chaque série validée), forcé dès que l’app passe en arrière-plan.
- **Copies de secours internes** : une copie récente, une copie avant chaque action risquée et une copie par jour (5 jours). Si la base est abîmée, FORGE se répare toute seule au démarrage. Tu peux aussi revenir à une copie : Profil → Stockage → Copies de secours.
- **Sauvegarde iCloud** : Profil → Stockage → **Sauvegarder dans iCloud** → menu Partager → **Enregistrer dans Fichiers** → iCloud Drive. L’app te le propose après les séances et te le rappelle (fréquence réglable).
- **Nouveau téléphone / réinstallation** : installe FORGE, puis sur l’écran d’accueil touche **« J’ai une sauvegarde »** et choisis le fichier dans iCloud Drive. Le fichier est vérifié et un résumé s’affiche avant de restaurer.
- **Testé** avec 3 000 séances (≈ 6 Mo, des années d’entraînement) : l’app reste fluide.

## Bon à savoir

- **Ce qui efface les données** : supprimer l’icône FORGE de l’iPhone, ou effacer les données des sites dans les réglages de Safari. D’où l’intérêt des sauvegardes iCloud.
- **L’adresse ne doit plus changer** : les données sont liées à l’adresse du site. En cas de changement, il faut sauvegarder puis restaurer.
- **Écran allumé** : pendant une séance, l’écran ne se met pas en veille.
- **Données du site de test** : ce que tu as saisi sur `localhost` dans ton PC ne passe pas sur le téléphone (sauvegarde puis restauration si tu veux le récupérer).
