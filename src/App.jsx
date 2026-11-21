import { useState, useRef, useEffect } from 'react'
import { useGeminiLive, getStoredKey, storeKey } from './hooks/useGeminiLive'
import { useWakeLock } from './hooks/useWakeLock'
import {
  startScreenCapture,
  startCameraCapture,
  stopScreenCapture,
  fileToJpeg,
} from './utils/captureFrame'
import ChatPanel from './components/ChatPanel'
import ScreenShareButton from './components/ScreenShareButton'

const canShareScreen =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getDisplayMedia

const canUseCamera =
  typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

// One page, two behaviours: a phone shows its surroundings through the camera,
// a computer shares its screen. Nothing to choose, it is detected.
const isPhone =
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

export default function App() {
  const { connected, connecting, micOn, messages, error, connect, disconnect, sendImage, sendText } =
    useGeminiLive()
  // Keeps the screen on while the conversation runs: a sleeping screen pauses
  // the microphone on Android.
  useWakeLock(connected || connecting)

  const [apiKey, setApiKey] = useState(getStoredKey())
  const [draftKey, setDraftKey] = useState('')
  const [sharing, setSharing] = useState(false)
  const [notice, setNotice] = useState(null)
  const [input, setInput] = useState('')
  const [installEvent, setInstallEvent] = useState(null)
  const [cameraOn, setCameraOn] = useState(false)
  const streamRef = useRef(null)
  const intervalRef = useRef(null)
  const camStreamRef = useRef(null)
  const camIntervalRef = useRef(null)
  const fileRef = useRef(null)

  // Chrome offers the install only once it considers the app installable; catch
  // it so the user gets a plain button instead of digging in the menu.
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setInstallEvent(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', () => setInstallEvent(null))
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const installLia = async () => {
    if (!installEvent) return
    try {
      await installEvent.prompt()
    } catch {
      // the prompt can only be used once
    }
    setInstallEvent(null)
  }

  const saveKey = (e) => {
    e.preventDefault()
    const key = draftKey.trim()
    if (!key) return
    storeKey(key)
    setApiKey(key)
    setDraftKey('')
  }

  // The screen request must stay inside the click: a wait of a few hundred
  // milliseconds and the browser no longer treats it as a user gesture.
  const handleStart = async () => {
    setNotice(null)
    connect()
    if (!canShareScreen) {
      setNotice(
        'No browser can capture the screen of a phone. Show Lia what you want with the camera, or take a screenshot and send it with the + button.',
      )
      return
    }
    try {
      const { stream, intervalId } = await startScreenCapture(sendImage)
      streamRef.current = stream
      intervalRef.current = intervalId
      setSharing(true)
    } catch (e) {
      console.warn('Screen capture refused', e)
      setNotice('Screen sharing refused — Lia keeps listening through the microphone.')
    }
  }

  const handleStop = () => {
    stopScreenCapture(streamRef.current, intervalRef.current)
    streamRef.current = null
    intervalRef.current = null
    setSharing(false)
    stopCamera()
    disconnect()
  }

  // The camera replaces screen sharing on a phone: Lia sees what you point at.
  const startCamera = async () => {
    setNotice(null)
    if (!connected) connect()
    try {
      const { stream, intervalId } = await startCameraCapture(sendImage)
      camStreamRef.current = stream
      camIntervalRef.current = intervalId
      setCameraOn(true)
    } catch (e) {
      const name = e?.name
      if (name === 'NotAllowedError') {
        setNotice('Camera refused: allow the camera in the browser (lock icon next to the address).')
      } else if (name === 'NotFoundError') {
        setNotice('No camera found on this device.')
      } else {
        setNotice('Camera unavailable on this device.')
      }
    }
  }

  // No browser on Android can capture the screen, so a screenshot taken with
  // the phone (power + volume down) is sent as a single image instead.
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice(null)
    try {
      const jpeg = await fileToJpeg(file)
      if (!connected) connect()
      sendImage(jpeg)
      setNotice('Image sent — Lia is looking at it.')
    } catch {
      setNotice('This image could not be read. Try a regular screenshot.')
    }
  }

  const stopCamera = () => {
    stopScreenCapture(camStreamRef.current, camIntervalRef.current)
    camStreamRef.current = null
    camIntervalRef.current = null
    setCameraOn(false)
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || !connected) return
    sendText(input.trim())
    setInput('')
  }

  if (!apiKey) {
    return (
      <div>
        <h1>👁️ Lia — Visual assistant</h1>
        <p className="status">
          Paste your Gemini key once. It stays in your browser: it is never sent to a
          server and never published.
        </p>
        <form className="input-row" onSubmit={saveKey}>
          <input
            type="password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="Gemini key (AIza… or AQ.…)"
            autoComplete="off"
          />
          <button type="submit">Save</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1>👁️ Lia — Visual assistant</h1>
      {installEvent && (
        <button className="install" onClick={installLia}>
          📲 Install Lia on the home screen
        </button>
      )}
      <div className="actions">
        <ScreenShareButton
          sharing={sharing || connected}
          canShareScreen={canShareScreen}
          onStart={handleStart}
          onStop={handleStop}
        />
        {canUseCamera && (
          <button className={cameraOn ? 'danger' : 'camera'} onClick={cameraOn ? stopCamera : startCamera}>
            {cameraOn ? '⏹ Stop the camera' : '📷 Back camera'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
      </div>
      <p className="status">
        {isPhone
          ? 'Phone mode: Lia sees what you show her with the camera, or a screenshot you send.'
          : 'Computer mode: Lia sees your shared screen, or your camera.'}
      </p>
      <div className="status">
        {connected
          ? `🟢 Connected${micOn ? ' · 🎤 microphone live — just talk' : ' · 🎤 microphone waiting'}${cameraOn ? ' · 📷 camera on' : ''}`
          : connecting
            ? '🟠 Connecting…'
            : '⚪ Disconnected'}
      </div>
      {notice && <div className="status">{notice}</div>}
      {error && <div className="error">{error}</div>}
      <ChatPanel messages={messages} />
      <form className="input-row" onSubmit={handleSend}>
        <button
          type="button"
          className="attach"
          onClick={() => fileRef.current?.click()}
          title="Send a screenshot"
          aria-label="Send a screenshot"
        >
          +
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? 'Ask Lia…' : 'Press the button to talk'}
          disabled={!connected}
        />
        <button type="submit" disabled={!connected}>Send</button>
      </form>
      <footer className="footer">
        <div>© {new Date().getFullYear()} Lia — Visual assistant. All rights reserved.</div>
        <div className="social">
          <a href="https://github.com/moonspiid/lia-screen-assistant" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://x.com/moonspiid" target="_blank" rel="noreferrer">X / Twitter</a>
          <a href="https://github.com/moonspiid/lia-screen-assistant/blob/main/README.md#support-this-project" target="_blank" rel="noreferrer">💛 Donate</a>
        </div>
      </footer>
    </div>
  )
}
