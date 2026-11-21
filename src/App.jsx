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

// Une seule page, deux comportements : un téléphone montre ce qui l'entoure avec
// la caméra, un ordinateur partage son écran. Rien à choisir, c'est détecté.
const isPhone =
  typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

export default function App() {
  const { connected, connecting, micOn, messages, error, connect, disconnect, sendImage, sendText } =
    useGeminiLive()
  // Garde l'écran allumé pendant la conversation : un écran qui s'éteint met le
  // micro en pause sur Android.
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

  // Chrome ne propose l'installation qu'une fois l'app jugée installable : on
  // l'attrape pour offrir un vrai bouton au lieu de fouiller dans le menu.
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
      // l'invite ne peut servir qu'une fois
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

  // La demande de partage doit rester dans le clic : quelques centaines de
  // millisecondes d'attente et le navigateur n'y voit plus un geste utilisateur.
  const handleStart = async () => {
    setNotice(null)
    connect()
    if (!canShareScreen) {
      setNotice(
        "Aucun navigateur ne peut capturer l'écran d'un téléphone. Montre à Lia ce que tu veux avec la caméra, ou envoie-lui une capture d'écran.",
      )
      return
    }
    try {
      const { stream, intervalId } = await startScreenCapture(sendImage)
      streamRef.current = stream
      intervalRef.current = intervalId
      setSharing(true)
    } catch (e) {
      console.warn('Partage d’écran refusé', e)
      setNotice('Partage d’écran refusé — Lia continue de t’écouter avec le micro.')
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

  // La caméra remplace le partage d'écran sur un téléphone : Lia voit ce que tu
  // lui montres.
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
        setNotice('Caméra refusée : autorise la caméra dans le navigateur (cadenas à côté de l’adresse).')
      } else if (name === 'NotFoundError') {
        setNotice('Aucune caméra trouvée sur cet appareil.')
      } else {
        setNotice('Caméra indisponible sur cet appareil.')
      }
    }
  }

  // Aucun navigateur Android ne peut capturer l'écran : une capture prise avec
  // le téléphone (power + volume bas) est donc envoyée comme une image.
  const handlePhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setNotice(null)
    try {
      const jpeg = await fileToJpeg(file)
      if (!connected) connect()
      sendImage(jpeg)
      setNotice('Image envoyée — Lia est en train de la regarder.')
    } catch {
      setNotice("Cette image n'a pas pu être lue. Essaie une capture d'écran classique.")
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
        <h1>👁️ Lia — Assistante visuelle</h1>
        <p className="status">
          Colle ta clé Gemini une seule fois. Elle reste dans ton navigateur : elle n’est
          jamais envoyée à un serveur et jamais publiée.
        </p>
        <form className="input-row" onSubmit={saveKey}>
          <input
            type="password"
            value={draftKey}
            onChange={(e) => setDraftKey(e.target.value)}
            placeholder="Clé Gemini (AIza… ou AQ.…)"
            autoComplete="off"
          />
          <button type="submit">Enregistrer</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1>👁️ Lia — Assistante visuelle</h1>
      {installEvent && (
        <button className="install" onClick={installLia}>
          📲 Installer Lia sur l’écran d’accueil
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
            {cameraOn ? '⏹ Arrêter la caméra' : '📷 Caméra arrière'}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhoto} />
      </div>
      <p className="status">
        {isPhone
          ? 'Mode téléphone : Lia voit ce que tu lui montres avec la caméra, ou une capture d’écran que tu envoies.'
          : 'Mode ordinateur : Lia voit ton écran partagé, ou ta caméra.'}
      </p>
      <div className="status">
        {connected
          ? `🟢 Connectée${micOn ? ' · 🎤 micro actif — parle normalement' : ' · 🎤 micro en attente'}${cameraOn ? ' · 📷 caméra allumée' : ''}`
          : connecting
            ? '🟠 Connexion…'
            : '⚪ Déconnectée'}
      </div>
      {notice && <div className="status">{notice}</div>}
      {error && <div className="error">{error}</div>}
      <ChatPanel messages={messages} />
      <form className="input-row" onSubmit={handleSend}>
        <button
          type="button"
          className="attach"
          onClick={() => fileRef.current?.click()}
          title="Envoyer une capture d’écran"
          aria-label="Envoyer une capture d’écran"
        >
          +
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={connected ? 'Écris à Lia…' : 'Appuie sur le bouton pour parler'}
          disabled={!connected}
        />
        <button type="submit" disabled={!connected}>Envoyer</button>
      </form>
      <footer className="footer">
        <div>© {new Date().getFullYear()} Lia — Assistante visuelle. Tous droits réservés.</div>
        <div className="social">
          <a href="https://github.com/moonspiid/lia-screen-assistant" target="_blank" rel="noreferrer">GitHub</a>
          <a href="https://x.com/moonspiid" target="_blank" rel="noreferrer">X / Twitter</a>
          <a href="https://github.com/moonspiid/lia-screen-assistant/issues" target="_blank" rel="noreferrer">Signaler un problème</a>
        </div>
      </footer>
    </div>
  )
}
