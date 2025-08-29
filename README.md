# Blindtest (Firebase Realtime Database)

Mini-site de blind test façon Kahoot : une page admin, une page joueur, un classement en direct.

## Démarrer
1. Crée un projet sur https://console.firebase.google.com
2. Active **Realtime Database** (mode test pour commencer)
3. Copie ta **config Web** dans `firebase-config.js`
4. Ouvre `admin.html` pour créer une salle et ajouter des questions
5. Les joueurs ouvrent `player.html`, entrent le code, jouent 🎵

## Hébergement
- Netlify / GitHub Pages / Vercel : projet **statique** (pas de backend requis).
- Les URLs média : utilise des **MP3 en lien direct** accessibles publiquement.

## Sécurité
Les règles d'exemple sont ouvertes pour tester. Restreins-les avant usage public :
```json
{
  "rules": {
    "rooms": {
      "$code": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```
