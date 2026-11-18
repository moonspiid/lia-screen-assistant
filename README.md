# Lia — Assistante visuelle en temps réel

Application web privée. Lia voit votre écran, vous entend et vous parle en temps réel via l'API Gemini Live.

## Installation
1. `npm install`
2. Copier `.env.example` en `.env` et ajouter la clé Gemini
3. `npm run dev`

## Utilisation
1. Cliquer sur "Partager mon écran avec Lia"
2. Autoriser micro + écran
3. Parler ou écrire : "Traduis ce texte", "Génère un tweet", etc.
4. Le texte généré apparaît dans le chat, prêt à copier.

## Limites tier gratuit
- 3 sessions simultanées
- ~2 min par session
- 15 requêtes/min (Gemini 2.0 Flash)

## Sécurité
Ne jamais partager un écran avec mots de passe ou données bancaires.
