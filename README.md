# Lia — Real-time visual assistant

<p>
  <img alt="react, 18" src="https://img.shields.io/badge/react-18-61dafb?labelColor=30363d">
  <img alt="vite, 5" src="https://img.shields.io/badge/vite-5-646cff?labelColor=30363d">
  <img alt="model, Gemini Live" src="https://img.shields.io/badge/model-Gemini%20Live-4285f4?labelColor=30363d">
  <img alt="api key, yours" src="https://img.shields.io/badge/api%20key-yours-8957e5?labelColor=30363d">
  <br>
  <img alt="input, screen + text" src="https://img.shields.io/badge/input-screen%20%2B%20text-bf8700?labelColor=30363d">
  <img alt="output, voice + transcript" src="https://img.shields.io/badge/output-voice%20%2B%20transcript-3fb950?labelColor=30363d">
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2ea043?labelColor=30363d">
</p>

**Lia watches your screen and answers out loud — in real time, through the Gemini Live API.**

You share a window once, then you ask: "translate this text", "write a tweet". She sees what you
see, says the answer, and the same answer appears as text in the chat, ready to copy.

<h3 align="center">
  <a href=".env.example">→ Set up the API key</a>
</h3>

<p align="center">
  React + Vite, a free Gemini key, no database.
  <br>
  Everything runs in the browser: your screen never leaves the session.
</p>

## Contents

- [Why](#why)
- [Setup in 3 steps](#setup-in-3-steps)
- [How to use it](#how-to-use-it)
- [Free tier limits](#free-tier-limits)
- [How it works](#how-it-works)
- [Good to know](#good-to-know)
- [License](#license)

## Why

Translating a text, writing a tweet, summarizing a document shown on screen: it is a constant
back-and-forth between a window and an AI tab. Copy, paste, copy again.

Lia removes the back-and-forth. You share your screen once, then you type — "translate this text",
"write a tweet" — and the answer arrives spoken and written, right next to you. No manual
screenshot, no copy-paste.

## Setup in 3 steps

1. Clone the repository and install the dependencies: `npm install`
2. Copy `.env.example` to `.env` and put your Gemini key in `VITE_GEMINI_API_KEY`
3. Run `npm run dev`, then open the address printed in the terminal.

A Gemini key can be created for free on Google AI Studio. The `.env` file is ignored by git: it never
ends up in the repository.

## How to use it

1. Click **"Share my screen with Lia"** and pick the window or tab she should watch.
2. Wait for the status line to turn green (**Connected to Gemini Live**).
3. Type a request — "Translate this text", "Write a tweet" — and send it.
4. She answers out loud, and the transcript of that answer fills the chat.

Frames of the shared window are sent about once per second, so give her a moment after scrolling
before asking about what is on screen.

## Free tier limits

The free Gemini API tier has rate limits and session limits that Google adjusts regularly, and they
differ per model. Check the current numbers on the
[rate limits page](https://ai.google.dev/gemini-api/docs/rate-limits) before relying on it for long
sessions. When a limit is reached the session closes: start screen sharing again.

## How it works

- Vite serves the React application; `index.html` mounts the root component.
- The key read from `.env` is injected on the client side at build time (`VITE_` prefix).
- Screen sharing goes through `getDisplayMedia`; `src/utils/captureFrame.js` draws the shared window
  on a canvas once per second and sends each frame as a JPEG through the socket.
- `src/hooks/useGeminiLive.js` opens the Gemini Live WebSocket session, streams those frames and the
  typed requests, plays the audio answer, and copies its transcript into the chat.
- The Live models that speak are audio-only: `responseModalities` is `['AUDIO']` and the written
  answer comes from `outputAudioTranscription`. That is why the same reply shows up twice — heard and
  read — without two requests.
- Nothing is stored server-side: there is no server.

## Good to know

- The API key lives in the browser: keep the application on a trusted origin and avoid a
  shared computer.
- A Gemini Live session is billed by duration; the free tier cuts it off after a while, which is
  normal, not a bug.
- Never share a screen containing passwords or banking data. This is written in the application, and
  it applies to any visual assistant.
- Input is the shared screen plus typed text. Speaking into the microphone is not wired yet: the
  voice you hear is Lia's answer, not your question.
- The repository contains the full running project: `index.html`, `vite.config.js`, `package.json`,
  `src/` (app, components, hook, capture utility) and `.env.example`. A `package-lock.json` is not
  committed, so `npm install` resolves the versions allowed by `package.json`.

## License

[MIT](LICENSE) © 2026 moonspiid — free to use, modify and redistribute.
