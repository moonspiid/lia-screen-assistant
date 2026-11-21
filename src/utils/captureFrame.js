export async function startScreenCapture(onFrame) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: { frameRate: 1 },
    audio: false,
  })

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

export function stopScreenCapture(stream, intervalId) {
  if (intervalId) clearInterval(intervalId)
  if (stream) stream.getTracks().forEach((t) => t.stop())
}
