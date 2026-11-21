import { useRef, useState, useCallback, useEffect } from 'react'

const WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent'
const MODEL = 'models/gemini-3.8-live'
const INPUT_RATE = 16000
const OUTPUT_RATE = 24000
const KEY_STORAGE = 'lia_gemini_key'

// The key is kept in the browser only: it is never bundled nor sent to a server.
export function getStoredKey() {
  try {
    return localStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function storeKey(key) {
  try {
    localStorage.setItem(KEY_STORAGE, key)
  } catch {
    // Storage can be blocked (private mode); the key then lasts for this session.
  }
}

const SYSTEM_PROMPT = `You are Lia, a real-time voice and visual assistant. The user talks to you through the microphone: you hear their voice and you answer out loud.
You may also receive images: a shared screen, the phone camera (about one frame per second), or a screenshot the user sends you. A phone screenshot shows the screen of their device.

IMPORTANT RULES:
- Never say "I can hear you" or "I can see your screen" out of politeness: only talk about what you actually perceive.
- If you received no sound or no image, say so plainly and ask the user to check the microphone or the sharing.
- Keep your answers short and spoken (2 to 4 sentences), unless you are asked for a written text.
- Answer in the user's language.

TEXT GENERATION RULES:
- When asked "write me a text", "translate this", "write a tweet", answer with the FINAL text, WITHOUT introduction, WITHOUT quotes, WITHOUT explanation.
- The text must be ready to copy and paste as is.
- If a translation is requested, give only the translation.

STYLE: natural, warm, efficient.

SAFETY: never repeat sensitive data (passwords, bank details).`

function downsampleTo16k(input, inputRate) {
  if (inputRate === INPUT_RATE) return input
  const ratio = inputRate / INPUT_RATE
  const length = Math.floor(input.length / ratio)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    const start = Math.floor(i * ratio)
    const end = Math.min(Math.floor((i + 1) * ratio), input.length)
    let sum = 0
    for (let j = start; j < end; j++) sum += input[j]
    out[i] = sum / Math.max(end - start, 1)
  }
  return out
}

function floatToBase64Pcm16(float32) {
  const int16 = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  const bytes = new Uint8Array(int16.buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export function useGeminiLive() {
  const wsRef = useRef(null)
  const outCtxRef = useRef(null)
  const playQueueRef = useRef([])
  const nextPlayRef = useRef(0)
  const micCtxRef = useRef(null)
  const micStreamRef = useRef(null)
  const micSourceRef = useRef(null)
  const micProcRef = useRef(null)
  const readyRef = useRef(false)
  const wantRef = useRef(false)
  const handleRef = useRef(null)
  const retryTimerRef = useRef(null)
  const retryCountRef = useRef(0)
  const connectRef = useRef(null)
  const pendingImageRef = useRef(null)

  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [micOn, setMicOn] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)

  // Appends a piece of text to the message being streamed, or starts a new one.
  const appendText = useCallback((role, text) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1]
      if (last && last.role === role && last.streaming) {
        return [...prev.slice(0, -1), { ...last, text: last.text + text }]
      }
      return [...prev, { role, text, streaming: true }]
    })
  }, [])

  const endTurn = useCallback(() => {
    setMessages((prev) => prev.map((m) => (m.streaming ? { ...m, streaming: false } : m)))
  }, [])

  const ensureOutCtx = useCallback(() => {
    if (!outCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      outCtxRef.current = new Ctx()
    }
    if (outCtxRef.current.state === 'suspended') {
      outCtxRef.current.resume().catch(() => {})
    }
    return outCtxRef.current
  }, [])

  const stopPlayback = useCallback(() => {
    for (const src of playQueueRef.current) {
      try {
        src.stop()
      } catch {
        // already stopped
      }
    }
    playQueueRef.current = []
    nextPlayRef.current = 0
  }, [])

  // Chunks are scheduled back-to-back instead of all at once: no more chopped audio.
  const playAudioChunk = useCallback(
    (base64) => {
      const ctx = ensureOutCtx()
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const int16 = new Int16Array(bytes.buffer)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
      const buffer = ctx.createBuffer(1, float32.length, OUTPUT_RATE)
      buffer.copyToChannel(float32, 0)
      const src = ctx.createBufferSource()
      src.buffer = buffer
      src.connect(ctx.destination)
      const now = ctx.currentTime
      if (nextPlayRef.current < now + 0.05) nextPlayRef.current = now + 0.05
      src.start(nextPlayRef.current)
      nextPlayRef.current += buffer.duration
      playQueueRef.current.push(src)
      src.onended = () => {
        playQueueRef.current = playQueueRef.current.filter((s) => s !== src)
      }
    },
    [ensureOutCtx],
  )

  const startMic = useCallback(async () => {
    const existing = micStreamRef.current
    if (existing) {
      // Android ends the track when the page goes to the background: start over.
      const alive = existing.getAudioTracks().some((t) => t.readyState === 'live')
      if (alive) {
        setMicOn(true)
        return
      }
      existing.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
      if (micCtxRef.current) {
        micCtxRef.current.close().catch(() => {})
        micCtxRef.current = null
      }
      micSourceRef.current = null
      micProcRef.current = null
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('This browser does not give access to the microphone. Try Chrome.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      micStreamRef.current = stream
      const Ctx = window.AudioContext || window.webkitAudioContext
      const ctx = new Ctx()
      micCtxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume()
      const source = ctx.createMediaStreamSource(stream)
      const proc = ctx.createScriptProcessor(4096, 1, 1)
      proc.onaudioprocess = (e) => {
        const ws = wsRef.current
        if (!readyRef.current || !ws || ws.readyState !== WebSocket.OPEN) return
        const pcm = downsampleTo16k(e.inputBuffer.getChannelData(0), ctx.sampleRate)
        ws.send(
          JSON.stringify({
            realtimeInput: {
              audio: { mimeType: `audio/pcm;rate=${INPUT_RATE}`, data: floatToBase64Pcm16(pcm) },
            },
          }),
        )
      }
      source.connect(proc)
      // Chrome only runs the processor when it is connected to a destination;
      // the processor output stays silent (we never write to it).
      proc.connect(ctx.destination)
      micSourceRef.current = source
      micProcRef.current = proc
      setMicOn(true)
    } catch (err) {
      const name = err?.name
      if (name === 'NotAllowedError') {
        setError('Microphone refused: allow it in the browser (lock icon next to the address).')
      } else if (name === 'NotFoundError') {
        setError('No microphone found on this device.')
      } else {
        setError(`Microphone unavailable: ${err?.message || name || err}`)
      }
    }
  }, [])

  const stopMic = useCallback(() => {
    if (micProcRef.current) {
      micProcRef.current.onaudioprocess = null
      try {
        micProcRef.current.disconnect()
      } catch {
        // already disconnected
      }
      micProcRef.current = null
    }
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect()
      } catch {
        // already disconnected
      }
      micSourceRef.current = null
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop())
      micStreamRef.current = null
    }
    if (micCtxRef.current) {
      micCtxRef.current.close().catch(() => {})
      micCtxRef.current = null
    }
    setMicOn(false)
  }, [])

  const openSocket = useCallback(() => {
    const key = import.meta.env.VITE_GEMINI_API_KEY || getStoredKey()
    if (!key) {
      setError('No Gemini key: paste it on the page before starting.')
      return
    }
    setError(null)
    setConnecting(true)
    readyRef.current = false

    const ws = new WebSocket(`${WS_URL}?key=${encodeURIComponent(key)}`)
    wsRef.current = ws

    ws.onopen = () => {
      const setup = {
        model: MODEL,
        // Native audio models answer with audio only. The transcript of that
        // answer (outputAudioTranscription) is what fills the chat in text.
        generationConfig: { responseModalities: ['AUDIO'] },
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        // Long conversations: keep the context from overflowing.
        contextWindowCompression: { slidingWindow: {} },
        // Lets us reconnect to the same conversation after a drop.
        sessionResumption: handleRef.current ? { handle: handleRef.current } : {},
      }
      ws.send(JSON.stringify({ setup }))
    }

    ws.onmessage = async (event) => {
      let raw
      if (typeof event.data === 'string') raw = event.data
      else if (event.data instanceof ArrayBuffer) raw = new TextDecoder().decode(event.data)
      else raw = await event.data.text()

      let data
      try {
        data = JSON.parse(raw)
      } catch {
        return
      }

      if (data.setupComplete) {
        readyRef.current = true
        retryCountRef.current = 0
        setConnected(true)
        setConnecting(false)
        setError(null)
        startMic()
        return
      }

      if (data.sessionResumptionUpdate) {
        const update = data.sessionResumptionUpdate
        if (update.resumable !== false && update.newHandle) handleRef.current = update.newHandle
        return
      }

      // Server is about to close the session (time limit): reconnect right away.
      if (data.goAway) {
        readyRef.current = false
        try {
          ws.close()
        } catch {
          // already closing
        }
        return
      }

      const content = data.serverContent
      if (!content) return

      if (content.interrupted) {
        stopPlayback()
        endTurn()
        return
      }

      for (const part of content.modelTurn?.parts || []) {
        if (part.text) appendText('lia', part.text)
        if (part.inlineData?.data) playAudioChunk(part.inlineData.data)
      }
      if (content.outputTranscription?.text) appendText('lia', content.outputTranscription.text)
      if (content.inputTranscription?.text) appendText('user', content.inputTranscription.text)
      if (content.turnComplete) endTurn()
    }

    ws.onerror = () => {
      // The close handler decides whether to reconnect.
      readyRef.current = false
    }

    ws.onclose = () => {
      readyRef.current = false
      if (wsRef.current === ws) wsRef.current = null
      setConnected(false)
      if (!wantRef.current) {
        setConnecting(false)
        return
      }
      // Live sessions are capped in length: reconnect silently and keep talking.
      setConnecting(true)
      const delay = Math.min(1000 * 2 ** retryCountRef.current, 8000)
      retryCountRef.current += 1
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = setTimeout(() => connectRef.current?.(), delay)
    }
  }, [appendText, endTurn, playAudioChunk, startMic, stopPlayback])

  useEffect(() => {
    connectRef.current = openSocket
  }, [openSocket])

  // Coming back to the tab after using another app: Chrome has suspended the
  // audio graphs and may have dropped the socket, so wake everything up.
  const resumeAudio = useCallback(async () => {
    for (const ctx of [outCtxRef.current, micCtxRef.current]) {
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume()
        } catch {
          // the browser still wants a tap; the pointerdown handler will retry
        }
      }
    }
  }, [])

  const wakeUp = useCallback(() => {
    resumeAudio()
    if (!wantRef.current) return
    const stream = micStreamRef.current
    const micDead = stream && !stream.getAudioTracks().some((t) => t.readyState === 'live')
    if (micDead || !stream) startMic()
    const ws = wsRef.current
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      clearTimeout(retryTimerRef.current)
      retryCountRef.current = 0
      openSocket()
    }
  }, [openSocket, resumeAudio, startMic])

  useEffect(() => {
    const onWake = () => {
      if (document.visibilityState === 'visible') wakeUp()
    }
    const onHide = () => {
      // Audio scheduled while in the background would play late and out of sync.
      if (document.visibilityState === 'hidden') stopPlayback()
    }
    const onVisibility = () => {
      onHide()
      onWake()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onWake)
    window.addEventListener('focus', onWake)
    // Some browsers only allow the audio to restart after a tap.
    document.addEventListener('pointerdown', onWake)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onWake)
      window.removeEventListener('focus', onWake)
      document.removeEventListener('pointerdown', onWake)
    }
  }, [stopPlayback, wakeUp])

  const connect = useCallback(() => {
    wantRef.current = true
    clearTimeout(retryTimerRef.current)
    retryCountRef.current = 0
    openSocket()
  }, [openSocket])

  const disconnect = useCallback(() => {
    wantRef.current = false
    clearTimeout(retryTimerRef.current)
    readyRef.current = false
    const ws = wsRef.current
    wsRef.current = null
    if (ws) {
      try {
        ws.close()
      } catch {
        // already closed
      }
    }
    stopMic()
    stopPlayback()
    if (outCtxRef.current) {
      outCtxRef.current.close().catch(() => {})
      outCtxRef.current = null
    }
    setConnected(false)
    setConnecting(false)
  }, [stopMic, stopPlayback])

  useEffect(() => () => {
    wantRef.current = false
    clearTimeout(retryTimerRef.current)
    try {
      wsRef.current?.close()
    } catch {
      // already closed
    }
  }, [])

  const sendImage = useCallback((base64Jpeg) => {
    // A picture sent while the session is still starting up is kept and sent
    // as soon as the model is ready, instead of being lost.
    if (!readyRef.current || wsRef.current?.readyState !== WebSocket.OPEN) {
      pendingImageRef.current = base64Jpeg
      return
    }
    wsRef.current.send(
      JSON.stringify({
        realtimeInput: {
          video: { mimeType: 'image/jpeg', data: base64Jpeg },
        },
      }),
    )
  }, [])

  useEffect(() => {
    if (connected && pendingImageRef.current) {
      const image = pendingImageRef.current
      pendingImageRef.current = null
      sendImage(image)
    }
  }, [connected, sendImage])

  const sendText = useCallback((text) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return
    setMessages((m) => [...m, { role: 'user', text, streaming: false }])
    wsRef.current.send(
      JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text }] }],
          turnComplete: true,
        },
      }),
    )
  }, [])

  return { connected, connecting, micOn, messages, error, connect, disconnect, sendImage, sendText }
}
