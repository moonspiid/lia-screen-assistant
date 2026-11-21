// Sends one JPEG per second from any video stream (screen or camera).
async function startVideoFrames(stream, onFrame) {
  const video = document.createElement('video')
  video.srcObject = stream
  video.muted = true
  await video.play()

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const intervalId = setInterval(() => {
    if (!video.videoWidth) return
    if (canvas.width !== video.videoWidth) canvas.width = video.videoWidth
    if (canvas.height !== video.videoHeight) canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    onFrame(dataUrl.split(',')[1])
  }, 1000)

  stream.getVideoTracks()[0].onended = () => {
    clearInterval(intervalId)
    stream.getTracks().forEach((t) => t.stop())
  }

  return { stream, intervalId }
}

export async function startScreenCapture(onFrame) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 1 },
    audio: false,
  })
  return startVideoFrames(stream, onFrame)
}

// On a phone there is no screen sharing, so Lia looks through the back camera.
export async function startCameraCapture(onFrame) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      frameRate: { ideal: 15 },
    },
    audio: false,
  })
  return startVideoFrames(stream, onFrame)
}

// A photo or a screenshot picked from the gallery: shrunk to a light JPEG before
// it is sent to the model.
export async function fileToJpeg(file, maxWidth = 1280) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxWidth / bitmap.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
}

export function stopScreenCapture(stream, intervalId) {
  if (intervalId) clearInterval(intervalId)
  if (stream) stream.getTracks().forEach((t) => t.stop())
}
