# Lia — real-time visual and voice assistant

Talk to Lia with your voice: she listens through the microphone, answers out loud, and looks at what you show her.
Everything runs in the browser, on the user's own Gemini API key.

React + Vite, no backend, no build server: the page talks directly to the Gemini Live API over a WebSocket.

## What it does

- **Real microphone input** — captured in the browser, downsampled to 16 kHz PCM and streamed as `realtimeInput.audio`.
- **Spoken answers** — 24 kHz PCM chunks scheduled back to back, so the voice never sounds chopped.
- **Visual input**
  - on a computer: the shared screen (one frame per second);
  - on a phone: the back camera (one frame per second);
  - on a phone: a screenshot picked from the gallery, sent as a single image.
- **Survives the real world** — automatic reconnection with backoff, `sessionResumption`, `contextWindowCompression`, and a wake-up when the page comes back to the foreground.
- **Screen wake lock** — the screen no longer turns off mid-conversation, which is what used to cut the microphone.
- **Installable** — a web app manifest plus a service worker (no cache, so updates land on the next reload).

The app adapts to the device: phone mode (camera + screenshot) or computer mode (screen sharing) is detected, there is nothing to configure.

## Getting started

```bash
npm install
npm run dev
```

Open the local address, paste your Gemini API key on the page once: it is stored in the browser (`localStorage`) and never sent anywhere except to the Gemini API.

Optional: copy `.env.example` to `.env` and set `VITE_GEMINI_API_KEY` if you prefer to provide the key at build time instead.

Production build:

```bash
npm run build
npm run preview
```

## Using it

1. Press **Talk to Lia** (or **Talk and share my screen** on a computer).
2. Allow the microphone; on a computer, pick the screen or window to share.
3. Talk normally. Lia answers out loud and the conversation is transcribed on screen.

On a phone:

- **Camera** shows Lia what you are pointing at — a place, a sign, a menu, a label.
- **Send a screenshot** sends a screenshot already saved on the phone (power + volume down to take one); useful when you want her to read your screen, since browsers cannot capture an Android screen.

## Known limits

- No browser on Android or iOS can capture the screen (`getDisplayMedia` is not available there), so a phone cannot share its screen live.
- Android suspends microphone capture when the page goes to the background: the conversation pauses while you use another app and resumes when you come back.
- The API key is a personal key. It lives in the browser only; never commit one to the repository.

## Project layout

```
src/App.jsx                  screen, camera, screenshot and install buttons
src/hooks/useGeminiLive.js   WebSocket session, microphone, audio playback, reconnection
src/hooks/useWakeLock.js     keeps the screen awake during a conversation
src/utils/captureFrame.js    screen/camera frames and image files to JPEG
src/components/              chat panel and share button
public/                      manifest, service worker, icon
```

## License

MIT — see [LICENSE](LICENSE).
