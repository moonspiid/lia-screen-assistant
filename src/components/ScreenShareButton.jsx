export default function ScreenShareButton({ sharing, onStart, onStop }) {
return sharing ? (
<button className="danger" onClick={onStop}>⏹ Arrêter le partage</button>
) : (
<button onClick={onStart}>▶ Partager mon écran avec Lia</button>
)
}