# Lia — Assistante visuelle en temps réel

<p>
  <img alt="react, 18" src="https://img.shields.io/badge/react-18-61dafb?labelColor=30363d">
  <img alt="vite, 5" src="https://img.shields.io/badge/vite-5-646cff?labelColor=30363d">
  <img alt="modèle, Gemini Live" src="https://img.shields.io/badge/model-Gemini%20Live-4285f4?labelColor=30363d">
  <img alt="clé API, à vous" src="https://img.shields.io/badge/api%20key-yours-8957e5?labelColor=30363d">
  <br>
  <img alt="entrée, voix et écran" src="https://img.shields.io/badge/input-voice%20%2B%20screen-bf8700?labelColor=30363d">
  <img alt="licence MIT" src="https://img.shields.io/badge/license-MIT-2ea043?labelColor=30363d">
</p>

**Lia regarde votre écran, vous écoute et vous répond à voix haute — en temps réel, via l'API Gemini Live.**

Vous parlez, elle voit. Le texte généré apparaît dans le chat, prêt à copier.

<h3 align="center">
  <a href=".env.example">→ Configurer la clé API</a>
</h3>

<p align="center">
  React + Vite, une clé Gemini gratuite, aucune base de données.
  <br>
  Tout tourne dans le navigateur : votre écran ne quitte pas la session.
</p>

## Sommaire

- [Pourquoi](#pourquoi)
- [Démarrage en 3 étapes](#démarrage-en-3-étapes)
- [Comment ça s'utilise](#comment-ça-sutilise)
- [Limites du palier gratuit](#limites-du-palier-gratuit)
- [Comment ça marche](#comment-ça-marche)
- [Bon à savoir](#bon-à-savoir)
- [Licence](#licence)

## Pourquoi

Traduire un texte, rédiger un tweet, résumer un document affiché à l'écran : ce sont des allers-retours
constants entre une fenêtre et un onglet d'IA. Copier, coller, recopier.

Lia supprime l'aller-retour. Vous partagez l'écran une fois, puis vous parlez — « traduis ce texte »,
« génère un tweet » — et la réponse arrive en texte, à côté. Pas de capture d'écran manuelle, pas de
copier-coller.

## Démarrage en 3 étapes

1. Cloner le dépôt et installer les dépendances : `npm install`
2. Copier `.env.example` en `.env` et y mettre votre clé Gemini dans `VITE_GEMINI_API_KEY`
3. Lancer : `npm run dev`, puis ouvrir l'adresse affichée dans le terminal.

Une clé Gemini se crée gratuitement sur Google AI Studio. Le fichier `.env` est ignoré par git : il ne
part jamais dans le dépôt.

## Comment ça s'utilise

1. Cliquer sur **« Partager mon écran avec Lia »**.
2. Autoriser le micro et l'écran dans la fenêtre du navigateur.
3. Parler ou écrire : « Traduis ce texte », « Génère un tweet », etc.
4. Le texte généré apparaît dans le chat, prêt à copier.

## Limites du palier gratuit

- 3 sessions simultanées
- environ 2 minutes par session
- 15 requêtes par minute (Gemini 2.0 Flash)

Au-delà, la session se coupe : il suffit de relancer le partage d'écran.

## Comment ça marche

- Vite sert l'application React ; `index.html` monte le composant racine.
- La clé lue dans `.env` est injectée côté client au build (préfixe `VITE_`).
- Le partage d'écran et le micro passent par les API du navigateur (`getDisplayMedia`,
  `getUserMedia`), puis le flux audio/vidéo part vers la session Gemini Live.
- Les réponses texte sont rendues dans le chat de l'application ; rien n'est stocké côté serveur, il
  n'y a pas de serveur.

## Bon à savoir

- La clé API est côté navigateur : gardez l'application sur une origine de confiance et évitez un
  ordinateur partagé.
- Une session Gemini Live est facturée à la durée ; le palier gratuit coupe au bout d'environ deux
  minutes, ce qui est normal, pas un bug.
- Ne jamais partager un écran contenant des mots de passe ou des données bancaires. C'est écrit dans
  l'application, et c'est valable pour n'importe quel assistant visuel.
- Le dépôt ne contient pour l'instant que la coquille du projet (`index.html`, `package.json`,
  `.env.example`) : le code source React est à ajouter pour que `npm run dev` affiche l'interface.

## Licence

[MIT](LICENSE) © 2026 moonspiid — utilisation, modification et redistribution libres.
