export default function ScreenShareButton({ sharing, canShareScreen, onStart, onStop }) {
  if (sharing) {
    return (
      <button className="danger" onClick={onStop}>⏹ Stop</button>
    )
  }
  return (
    <button onClick={onStart}>
      {canShareScreen ? '▶ Talk and share my screen' : '▶ Talk to Lia'}
    </button>
  )
}
