import { useState, useRef } from 'react'
import { useGeminiLive } from './hooks/useGeminiLive'
import { startScreenCapture, stopScreenCapture } from './utils/captureFrame'
import ChatPanel from './components/ChatPanel'
import ScreenShareButton from './components/ScreenShareButton'

export default function App() {
const { connected, messages, error, connect, disconnect, sendImage, sendText } = useGeminiLive()
const [sharing, setSharing] = useState(false)
const [input, setInput] = useState('')
const streamRef = useRef(null)
const intervalRef = useRef(null)

const handleStart = () => {
connect()
setTimeout(async () => {
try {
const { stream, intervalId } = await startScreenCapture(sendImage)
streamRef.current = stream
intervalRef.current = intervalId
setSharing(true)
} catch (e) {
console.error('Capture refusée', e)
}
}, 1500)
}

const handleStop = () => {
stopScreenCapture(streamRef.current, intervalRef.current)
streamRef.current = null
intervalRef.current = null
setSharing(false)
disconnect()
}

const handleSend = (e) => {
e.preventDefault()
if (!input.trim() || !connected) return
sendText(input.trim())
setInput('')
}

return (
<div>
<h1>👁️ Lia — Assistante visuelle</h1>
<ScreenShareButton sharing={sharing} onStart={handleStart} onStop={handleStop} />
<div className="status">
{connected ? '🟢 Connectée à Gemini Live' : '⚪ Déconnectée'}
</div>
{error && <div className="error">{error}</div>}
<ChatPanel messages={messages} />
<form className="input-row" onSubmit={handleSend}>
<input
value={input}
onChange={(e) => setInput(e.target.value)}
placeholder={connected ? 'Demande à Lia…' : 'Partage ton écran d’abord'}
disabled={!connected}
/>
<button type="submit" disabled={!connected}>Envoyer</button>
</form>
</div>
)
}