<p align="center">
  <img src="public/icons/icon-192.png" width="96" height="96" alt="Logo FORGE" />
</p>

<h1 align="center">FORGE — Coach fitness</h1>

<p align="center">
  <b>L’application de musculation qui tient dans ta poche : séances, exercices, progression et calories.</b><br />
  Installable sur iPhone et Android, 100 % hors ligne, tes données restent sur ton téléphone.
</p>

<p align="center">
  <a href="https://forgecoachfitness.pages.dev"><b>👉 Ouvrir l’application</b></a>
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-hors_ligne-FF6B1A" />
  <img alt="Cloudflare Pages" src="https://img.shields.io/badge/déployé_sur-Cloudflare_Pages-F38020?logo=cloudflare&logoColor=white" />
</p>

---

## Le projet

FORGE est née d’un constat simple : les bonnes applis de musculation sont presque toutes payantes, demandent un compte et envoient tes données sur leurs serveurs. L’objectif était de construire une alternative **gratuite**, **sans compte**, au niveau d’une appli premium, utilisable directement à la salle, même sans réseau.

C’est une **Progressive Web App** : on l’ouvre une fois dans le navigateur du téléphone, on l’ajoute à l’écran d’accueil, et elle se comporte comme une vraie application (icône, plein écran, fonctionnement hors ligne, mises à jour automatiques).

## Fonctionnalités

### 🏋️ Séance en direct
- Saisie **série par série** (charge, répétitions, durée, distance) avec la performance de la séance précédente pré-remplie
- **Minuteur de repos** automatique au moment où une série est validée, avec signal sonore et vibration
- Séries d’échauffement, notes par exercice, réorganisation des exercices
- **Calories et volume en direct**, écran maintenu allumé pendant la séance
- Bilan de fin de séance : records battus, XP gagnée, muscles travaillés

### 📚 137 exercices
- Musculation, poids du corps, cardio, fonctionnel et **mobilité**
- Pour chaque exercice : exécution pas à pas, **erreurs à éviter**, conseil du coach, muscles ciblés sur une **carte anatomique**, dépense estimée
- **Séries / répétitions / repos conseillés selon ton objectif** (force, prise de muscle, perte de gras, forme)
- **Alternatives** qui ciblent les mêmes muscles (machine prise, matériel absent…)

### 🔎 Recherche intelligente en français
Un moteur de recherche maison qui comprend la façon dont on parle à la salle :
- argot et abréviations : *pecs*, *DC*, *SDT*, *biscotos*, *abdos*, *kb*
- noms anglais : *bench*, *deadlift*, *butterfly*
- **fautes de frappe** : *devlope couche*, *tracions*, *abdso*
- intentions : *dos sans matériel*, *fessiers maison*, *abdos débutant*, *brûler des calories*
- groupes : *jambes* → squats et fentes d’abord, *bras* → biceps et triceps
- autocomplétion au clavier, raison de chaque résultat (« Trouvé via : Pectoraux · Haltères ») et suggestion « Tu voulais dire… ? »

### 📈 Progression & tableau de bord
- Tableau de bord : prochaine séance recommandée, objectif hebdomadaire, calories et volume, **carte de récupération musculaire**, régularité sur 18 semaines, records récents
- **1RM estimé** (formule d’Epley) par exercice, volume hebdomadaire, séries par muscle comparées à la zone 10–20 séries
- Historique avec calendrier, journal des records

### 🔥 Calories & poids
- Métabolisme de base (Mifflin-St Jeor), dépense quotidienne, dépense des séances (méthode MET)
- Bilan calorique, **projection de poids** jusqu’à l’objectif, macros conseillées
- Journal des pesées (poids, masse grasse, tour de taille), IMC

### 🧰 Outils
- Calculateur de 1RM avec table de pourcentages
- Calculateur de **chargement de barre** avec visualisation des disques
- Minuteur d’intervalles **Tabata / HIIT / EMOM**

### 🎮 Motivation
- Niveaux, XP et **10 badges** à débloquer, séries de semaines consécutives
- **Plusieurs profils** sur le même téléphone, avec déconnexion

## Données & vie privée

Aucun compte, aucun serveur de données : **tout est stocké sur le téléphone de l’utilisateur**. Le site hébergé ne sert qu’à télécharger l’application.

La couche de stockage a été conçue pour ne pas perdre de données :
- base **IndexedDB**, enregistrement automatique à chaque action, écritures groupées et **forcées dès que l’app passe en arrière-plan** (iOS peut fermer une app à tout moment)
- **copies de secours internes** (copie récente, copie avant chaque action risquée, copie journalière sur 5 jours) et **réparation automatique** si la base principale est illisible
- sauvegarde manuelle dans **un fichier unique par année** (`FORGE-sauvegarde-2026.json`) via le menu de partage (iCloud Drive, Google Drive…), restauration avec **fusion** des données sans doublon
- testé avec **3 000 séances** (≈ 6 Mo) sans perte de fluidité

## Installer l’application

| iPhone / iPad | Android |
|---|---|
| Ouvrir le lien dans **Safari** → bouton **Partager** → **« Sur l’écran d’accueil »** | Ouvrir le lien dans **Chrome** → **« Installer l’application »** |

Le pas-à-pas est aussi disponible dans l’app (menu **Installer l’app**).

## Stack technique

| Domaine | Choix |
|---|---|
| Interface | React 18, React Router, Tailwind CSS, icônes Lucide |
| Graphiques | Recharts |
| État & persistance | Zustand + couche de stockage IndexedDB maison (`src/lib/storage.js`) |
| Application installable | vite-plugin-pwa (Workbox) : manifeste, service worker, cache hors ligne, mises à jour à la demande |
| Polices | Barlow / Barlow Condensed embarquées (aucune dépendance réseau) |
| Build & hébergement | Vite, Cloudflare Pages (publication automatique à chaque push sur `main`) |

## Structure

```
src/
├── data/            # bibliothèque d’exercices, noms alternatifs, programmes
├── lib/
│   ├── calc.js      # calories (MET), 1RM, métabolisme, records, séries, badges
│   ├── search.js    # moteur de recherche français (synonymes, fautes, intentions)
│   ├── storage.js   # stockage IndexedDB blindé (copies de secours, réparation)
│   ├── store.js     # état global, profils, séances, fusion des sauvegardes
│   └── pwa.js       # installation, sauvegarde, écran allumé
├── components/      # UI : carte anatomique, recherche, panneaux, modales…
└── pages/           # tableau de bord, séance, exercices, progression…
```

## Lancer le projet en local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # version de production dans dist/
npm run preview    # tester la version de production (mode hors ligne compris)
```

Régénérer les icônes : `python scripts/make-icons.py` (nécessite Pillow).

## Déploiement

L’application est hébergée sur **Cloudflare Pages**, relié à ce dépôt : chaque push sur `main` reconstruit et publie automatiquement le site (`npm run build` → `dist/`, règles de cache dans `public/_headers`).

---

<p align="center">Projet réalisé par <b>Thomas</b>.</p>
