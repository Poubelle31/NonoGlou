# Glouglou 💧

Une petite web app pour penser à boire de l'eau. Rappels toutes les 1h30, de 9h à 21h (heure de Paris).

## Mise en place (environ 20 minutes, une seule fois)

### 1. Créer le dépôt GitHub
1. Crée un compte sur github.com si tu n'en as pas.
2. Crée un nouveau dépôt **public** nommé `glouglou`.
3. Sur la page du dépôt : « uploading an existing file », puis glisse **tout le contenu** du dossier
   (y compris le dossier `.github` et le fichier `.nojekyll`). Valide avec « Commit changes ».

### 2. Générer les clés de notification (VAPID)
Sur ton PC, installe Node.js (nodejs.org, version LTS), puis dans un terminal :

    npx web-push generate-vapid-keys

Tu obtiens une *Public Key* et une *Private Key*. Garde la clé privée pour toi.

Sur GitHub, ouvre `config.js`, clique sur le crayon, remplace `COLLE_TA_CLE_PUBLIQUE_ICI`
par la **clé publique**, puis « Commit changes ».

### 3. Ajouter les secrets
Dépôt › Settings › Secrets and variables › Actions › « New repository secret » :

| Nom | Valeur |
|---|---|
| `VAPID_PUBLIC_KEY` | la clé publique |
| `VAPID_PRIVATE_KEY` | la clé privée |
| `VAPID_CONTACT` | `mailto:ton@email.fr` |

### 4. Mettre l'app en ligne
Settings › Pages › Source : « Deploy from a branch », branche `main`, dossier `/ (root)`.
Après une minute, l'app est disponible sur `https://TON-PSEUDO.github.io/glouglou/`.

### 5. Sur son iPhone (iOS 16.4 minimum)
1. Ouvrir le lien dans **Safari**.
2. Bouton Partager › « Sur l'écran d'accueil ».
3. Ouvrir Glouglou **depuis la nouvelle icône**.
4. Toucher 🔔 › « Activer les rappels » › Autoriser.
5. « Copier le code » et te l'envoyer.

### 6. Brancher son téléphone
Ajoute un dernier secret `PUSH_SUBSCRIPTION` avec le code reçu (tout le texte, accolades comprises).

### 7. Tester
Onglet Actions › « Rappels Glouglou » › « Run workflow ». La notification arrive en quelques secondes.

## Personnaliser
- **Messages** : liste `MESSAGES` dans `notifier/send.mjs`.
- **Objectif du jour** : `OBJECTIF` dans `config.js`.
- **Horaires** : `.github/workflows/rappels.yml` (heures en UTC, une ligne pour l'été et une pour l'hiver).

Chaque modification poussée sur GitHub est prise en compte automatiquement : pas besoin de réinstaller l'app.

## Si ça ne marche pas
- **Rien n'arrive** : vérifier Réglages › Notifications › Glouglou, et les modes Concentration.
- **Le workflow est rouge avec « Abonnement expiré »** : refaire l'étape 5 et remplacer le secret `PUSH_SUBSCRIPTION`.
- **Un rappel arrive avec un peu de retard** : c'est normal, le planificateur de GitHub peut décaler de 10 à 20 minutes.
- **Les rappels se sont arrêtés** : onglet Actions › « Rappels Glouglou » › « Enable workflow » si GitHub l'a mis en pause.
