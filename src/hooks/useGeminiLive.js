import { useRef, useState, useCallback } from 'react'

const WS_URL =
'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'
const MODEL = 'models/gemini-2.0-flash-exp'

const SYSTEM_PROMPT = `Tu es Lia, une assistante visuelle et vocale en temps réel.
Tu vois l'écran partagé par l'utilisateur (frames à ~1 FPS) et tu l'entends.

RÈGLES DE GÉNÉRATION DE TEXTE :
• Quand on te demande "génère-moi un texte", "traduis ceci", "écris un tweet",
réponds avec le texte FINAL, SANS introduction, SANS guillemets, SANS explication.
• Le texte doit être prêt à copier-coller tel quel.
• Si traduction demandée, donne uniquement la traduction.

RÈGLES DE GUIDAGE :
• Décris les éléments utiles de l'écran de façon concise.
• Si l'utilisateur est bloqué, propose 1 à 3 étapes maximum.

STYLE : naturel, chaleureux, efficace. Réponds dans la langue de l'utilisateur.

SÉCURITÉ : ne répète jamais de données sensibles (mots de passe, IBAN).`

export function useGeminiLive() {
const wsRef = useRef(null)
const audioCtxRef = useRef(null)
const [connected, setConnected] = useState(false)
const [messages, setMessages] = useState([])
const [error, setError] = useState(null)

const playAudioChunk = useCallback((base64) => {
if (!audioCtxRef.current) {
audioCtxRef.current = new AudioContext({ sampleRate: 24000 })
}
const ctx = audioCtxRef.current
const binary = atob(base64)
const bytes = new Uint8Array(binary.length)
for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
const int16 = new Int16Array(bytes.buffer)
const float32 = new Float32Array(int16.length)
for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
const buffer = ctx.createBuffer(1, float32.length, 24000)
buffer.copyToChannel(float32, 0)
const src = ctx.createBufferSource()
src.buffer = buffer
src.connect(ctx.destination)
src.start()
}, [])

const connect = useCallback(() => {
const key = import.meta.env.VITE_GEMINI_API_KEY
if (!key) {
setError('Clé VITE_GEMINI_API_KEY manquante dans .env')
return
}
const ws = new WebSocket(${WS_URL}?key=${key})
wsRef.current = ws

ws.onopen = () => {
ws.send(JSON.stringify({
setup: {
model: MODEL,
generationConfig: { responseModalities: ['AUDIO'] },
systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
},
}))
}

ws.onmessage = async (event) => {
const text = event.data instanceof Blob ? await event.data.text() : event.data
const data = JSON.parse(text)
if (data.setupComplete) { setConnected(true); return }
if (data.serverContent) {
const parts = data.serverContent.modelTurn?.parts || []
for (const p of parts) {
if (p.text) setMessages((m) => [...m, { role: 'lia', text: p.text }])
if (p.inlineData?.data) playAudioChunk(p.inlineData.data)
}
}
}

ws.onerror = () => setError('Erreur WebSocket — vérifie la clé API')
ws.onclose = () => setConnected(false)
}, [playAudioChunk])

const disconnect = useCallback(() => {
wsRef.current?.close()
wsRef.current = null
setConnected(false)
}, [])

const sendImage = useCallback((base64Jpeg) => {
if (wsRef.current?.readyState !== WebSocket.OPEN) return
wsRef.current.send(JSON.stringify({
realtimeInput: {
mediaChunks: [{ mimeType: 'image/jpeg', data: base64Jpeg }],
},
}))
}, [])

const sendText = useCallback((text) => {
if (wsRef.current?.readyState !== WebSocket.OPEN) return
setMessages((m) => [...m, { role: 'user', text }])
wsRef.current.send(JSON.stringify({
clientContent: {
turns: [{ role: 'user', parts: [{ text }] }],
turnComplete: true,
},
}))
}, [])

return { connected, messages, error, connect, disconnect, sendImage, sendText }
}