# Lia — Real-time visual assistant

<p>
  <img alt="react, 18" src="https://img.shields.io/badge/react-18-61dafb?labelColor=30363d">
  <img alt="vite, 5" src="https://img.shields.io/badge/vite-5-646cff?labelColor=30363d">
  <img alt="model, Gemini Live" src="https://img.shields.io/badge/model-Gemini%20Live-4285f4?labelColor=30363d">
  <img alt="api key, yours" src="https://img.shields.io/badge/api%20key-yours-8957e5?labelColor=30363d">
  <br>
  <img alt="input, voice + screen" src="https://img.shields.io/badge/input-voice%20%2B%20screen-bf8700?labelColor=30363d">
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2ea043?labelColor=30363d">
</p>

**Lia watches your screen, listens to you and answers out loud — in real time, through the Gemini Live API.**

You speak, she sees. The generated text shows up in the chat, ready to copy.

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

Lia removes the back-and-forth. You share your screen once, then you talk — “translate this text”,
“write a tweet” — and the answer arrives as text, right next to you. No manual screenshot, no
copy-paste.

## Setup in 3 steps

1. Clone the repository and install the dependencies: `npm install`
2. Copy `.env.example` to `.env` and put your Gemini key in `VITE_GEMINI_API_KEY`
3. Run `npm run dev`, then open the address printed in the terminal.

A Gemini key can be created for free on Google AI Studio. The `.env` file is ignored by git: it never
ends up in the repository.

## How to use it

1. Click **“Share my screen with Lia”**.
2. Allow the microphone and the screen in the browser prompt.
3. Talk or type: “Translate this text”, “Write a tweet”, and so on.
4. The generated text shows up in the chat, ready to copy.

## Free tier limits

- 3 simultaneous sessions
- about 2 minutes per session
- 15 requests per minute (Gemini 2.0 Flash)

Beyond that, the session closes: just start screen sharing again.

## How it works

- Vite serves the React application; `index.html` mounts the root component.
- The key read from `.env` is injected on the client side at build time (`VITE_` prefix).
- Screen sharing and the microphone go through the browser APIs (`getDisplayMedia`,
  `getUserMedia`), then the audio/video stream is sent to the Gemini Live session.
- Text answers are rendered in the application chat; nothing is stored server-side, there
  is no server.

## Good to know

- The API key lives in the browser: keep the application on a trusted origin and avoid a
  shared computer.
- A Gemini Live session is billed by duration; the free tier cuts off after about two
  minutes, which is normal, not a bug.
- Never share a screen containing passwords or banking data. This is written in the
  application, and it applies to any visual assistant.
- The repository currently only contains the project shell (`index.html`, `package.json`,
  `.env.example`): the React source code still has to be added for `npm run dev` to display
  the interface.

## License

[MIT](LICENSE) © 2026 moonspiid — free to use, modify and redistribute.
