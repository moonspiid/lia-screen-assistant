• export async function startScreenCapture(onFrame) {
const stream = await navigator.mediaDevices.getDisplayMedia({
video: { frameRate: 1 },
audio: false,
})

const video = document.createElement('video')
video.srcObject = stream
video.muted = true
await video.play()

const canvas = document.createElement('canvas')
canvas.width = video.videoWidth
canvas.height = video.videoHeight
const ctx = canvas.getContext('2d')

const intervalId = setInterval(() => {
ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
const base64 = dataUrl.split(',')[1]
onFrame(base64)
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