export default function ScreenShareButton({ sharing, canShareScreen, onStart, onStop }) {
  if (sharing) {
    return (
      <button className="danger" onClick={onStop}>⏹ Arrêter</button>
    )
  }
  return (
    <button onClick={onStart}>
      {canShareScreen ? '▶ Parler et partager mon écran' : '▶ Parler à Lia'}
    </button>
  )
}
