# Lia — Visual assistant

<p>
  <img alt="real-time voice" src="https://img.shields.io/badge/voice-realtime-ffd43b?labelColor=30363d">
  <img alt="sees your screen" src="https://img.shields.io/badge/screen%20%2B%20camera-live-2ea043?labelColor=30363d">
  <img alt="Gemini Live API" src="https://img.shields.io/badge/Gemini-Live%20API-1f6feb?labelColor=30363d">
  <img alt="React + Vite" src="https://img.shields.io/badge/React%20%2B%20Vite-18-61dafb?labelColor=30363d">
  <br>
  <img alt="installable PWA" src="https://img.shields.io/badge/pwa-installable-ea7a15?labelColor=30363d">
  <img alt="keys stored locally" src="https://img.shields.io/badge/keys-stored%20locally-3fb950?labelColor=30363d">
  <img alt="MIT license" src="https://img.shields.io/badge/license-MIT-2ea043?labelColor=30363d">
  <img alt="price, free" src="https://img.shields.io/badge/price-free-2ea043?labelColor=30363d">
</p>

**You talk, Lia looks, Lia answers out loud.** A real-time voice and visual assistant: she hears you through the microphone, watches your shared screen (on a computer) or your back camera (on a phone), and replies by voice in a few sentences.

<h3 align="center">
  <a href="https://moonspiid.github.io/lia-screen-assistant/">↖ Open the app</a>
</h3>

<p align="center">
  No account, no server, no install — paste your own Gemini key once and start talking.
  <br>
  Your key stays in your browser and is sent straight to Google, never to a third party.
</p>

## Contents

- [Why](#why)
- [Features](#features)
- [Quick start](#quick-start)
- [Install it as an app](#install-it-as-an-app)
- [How it works](#how-it-works)
- [Good to know](#good-to-know)
- [Support this project](#support-this-project)
- [License](#license)

## Why

Showing is faster than describing. Instead of typing a long explanation of what is on your screen, you point the camera at it — or share your screen — and ask a question out loud. Lia answers with her voice, so you keep your hands free.

## Features

- **Real-time voice, both ways** — the microphone audio goes up, the answer comes back as speech (Gemini Live API, `models/gemini-3.8-live`). The conversation is transcribed in the chat as it happens.
- **She sees what you see** — one JPEG frame per second, from your shared screen on a computer or from the **back camera** on a phone.
- **Screenshots by the + button** — the **+** next to the message box opens the gallery or the camera app and sends the picture to Lia.
- **Text when you prefer** — type a message; her spoken answer is still transcribed.
- **Survives a phone that switches apps** — coming back from another app rebuilds the microphone and the WebSocket, so Lia keeps answering after the screen was off (that is what `src/hooks/useGeminiLive.js` takes care of).
- **Installable app** — web app manifest, yellow icon and a service worker, so Chrome installs it as a standalone app.
- **Keeps the screen awake** — the wake lock stops Android from pausing the microphone mid-conversation.
- **Keys never leave the browser** — the Gemini key is stored in `localStorage` (`lia_gemini_key`) and never published with the site.

## Quick start

1. Open **[the online version](https://moonspiid.github.io/lia-screen-assistant/)**.
2. Paste a Gemini API key ([Google AI Studio](https://aistudio.google.com/apikey), keys start with `AIza` or `AQ.`) and press **Save**.
3. Press **▶ Talk to Lia** and allow the microphone.
4. On a computer, allow screen sharing; on a phone, press **📷 Back camera** and point it at what you want her to see.

## Install it as an app

- **Android / Chrome** — ⋮ menu → *Install app* (or the install icon in the address bar), or *Add to home screen*.
- **iPhone / Safari** — Share → *Add to Home Screen*.
- **Desktop Chrome / Edge** — the install icon in the address bar.

It then runs in its own window with the yellow Lia icon.

## How it works

- `src/App.jsx` — the page: buttons, status line, message box with the **+** button, footer.
- `src/hooks/useGeminiLive.js` — the Gemini Live WebSocket: microphone capture, playback of the answer, reconnection and session resumption, wake-up after the app was in the background.
- `src/utils/captureFrame.js` — one JPEG per second from the screen stream or the camera stream, plus shrinking of the picture you send with **+**.
- `src/index.css` — the yellow theme (`#ffd43b`).
- Pushing to `main` rebuilds and republishes the site through GitHub Actions (`.github/workflows/deploy.yml`).

## Good to know

- No browser can capture the screen of a phone: use the back camera or a screenshot sent with **+**.
- Speech, camera and screen need HTTPS — GitHub Pages provides it.
- The microphone and the camera are only active while you started them; **⏹ Stop** releases both.
- Only one conversation at a time per tab, and the answer is short by design (2 to 4 spoken sentences).

## Support this project

The app is free, has no account, no ads and no tracking, and there is no paid tier to upsell. If it saves you time, a donation pays for the hours behind it and the next features.

**Donate in USDT →** one crypto address, no card, no account, no payment processor in between.

<p align="center">
  <img src="https://raw.githubusercontent.com/moonspiid/ai-agent-multi-model/master/donate-usdt-qr.png" alt="QR code of the EVM donation address" width="200">
  <br>
  <sub>Scan with any wallet app</sub>
</p>

```
0xA2700896E16BE762467D458F2B45260f8FAC9F3e
```

This is a plain EVM address, so **the same address works on every EVM network**. Send USDT on whichever one suits you:

| Network | Token |
| --- | --- |
| BNB Smart Chain (BEP20) | USDT |
| Ethereum (ERC20) | USDT |
| Polygon | USDT |
| Arbitrum One | USDT |
| Base | USDT |
| Optimism | USDT |

Two rules: send **USDT only** (another token sent to this address cannot be recovered), and keep a little of the network's own coin (BNB, ETH, POL) in your wallet to pay the transfer fee. A non-EVM network such as Tron (TRC20) uses a different address format, so nothing sent there reaches this one.

## License

[MIT](LICENSE) © 2026 moonspiid — use it, modify it, ship it.
