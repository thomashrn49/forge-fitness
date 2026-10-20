# Mettre FORGE sur ton téléphone (gratuit)

Seul le **code** de l’app est hébergé sur Netlify. Tes séances, pesées et records restent **uniquement dans ton téléphone**.

## Étape 1 — Mettre l’app en ligne (une seule fois, ~5 min, sur ton PC)

1. Va sur **https://app.netlify.com/signup** et crée un compte gratuit (avec ton email ou GitHub).
2. Une fois connecté, va sur **https://app.netlify.com/drop**.
3. Glisse-dépose le fichier **`FORGE-a-deposer-sur-Netlify.zip`** (dans le dossier `fitness-app`) dans la zone indiquée.
4. Attends quelques secondes : Netlify te donne une adresse du type `https://nom-au-hasard-123.netlify.app`.
5. *(Facultatif)* Pour une adresse plus simple : **Site configuration → Change site name** → par exemple `forge-coach` → ton app sera sur `https://forge-coach.netlify.app` (s’il est déjà pris, essaie une variante).

> Si tu déposes sans être connecté, Netlify supprime le site au bout d’une heure : crée bien le compte avant.

## Étape 2 — Installer l’app

### iPhone / iPad
1. Ouvre l’adresse Netlify dans **Safari** (obligatoire, pas Chrome).
2. Touche **Partager** (carré avec une flèche vers le haut).
3. Choisis **« Sur l’écran d’accueil »** → **Ajouter**.
4. Ouvre FORGE depuis l’icône orange.

### Android
1. Ouvre l’adresse Netlify dans **Chrome**.
2. Touche **Installer** dans la bannière, ou menu **⋮ → Installer l’application**.
3. FORGE apparaît dans tes applications.

Ouvre l’app une première fois avec du réseau : elle se télécharge entièrement et fonctionne ensuite **hors ligne**.

## Mettre à jour l’app plus tard

Quand je modifie FORGE, je régénère le fichier zip. Ensuite :
1. Netlify → ton site → onglet **Deploys**.
2. Glisse-dépose le nouveau zip dans la zone « Drag and drop your site output folder here ».
3. Sur ton téléphone, l’app affiche **« Nouvelle version disponible »** → **Mettre à jour**. Tes données sont conservées.

## Tes données : comment elles sont protégées

- **Enregistrement automatique** à chaque action (chaque série validée), forcé dès que l’app passe en arrière-plan.
- **Copies de secours internes** : une copie récente, une copie avant chaque action risquée et une copie par jour (5 jours). Si la base est abîmée, FORGE se répare toute seule au démarrage. Tu peux aussi revenir à une copie : Profil → Stockage → Copies de secours.
- **Sauvegarde iCloud** : Profil → Stockage → **Sauvegarder dans iCloud** → menu Partager → **Enregistrer dans Fichiers** → iCloud Drive. L’app te le propose après les séances et te le rappelle (fréquence réglable).
- **Nouveau téléphone / réinstallation** : installe FORGE, puis sur l’écran d’accueil touche **« J’ai une sauvegarde »** et choisis le fichier dans iCloud Drive. Le fichier est vérifié et un résumé s’affiche avant de restaurer.
- **Testé** avec 3 000 séances (≈ 6 Mo, des années d’entraînement) : l’app reste fluide.

## Bon à savoir

- **Ce qui efface les données** : supprimer l’icône FORGE de l’iPhone, ou effacer les données des sites dans les réglages de Safari. D’où l’intérêt des sauvegardes iCloud.
- **Choisis le nom du site Netlify avant de commencer** : changer l’adresse plus tard crée une app « vide » (tu pourrais restaurer ta sauvegarde, mais autant l’éviter).
- **Écran allumé** : pendant une séance, l’écran ne se met pas en veille.
- **Données du site de test** : ce que tu as saisi sur `localhost` dans ton PC ne passe pas sur le téléphone (sauvegarde puis restauration si tu veux le récupérer).
