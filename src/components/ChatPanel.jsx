export default function ChatPanel({ messages }) {
  return (
    <div className="chat">
      {messages.length === 0 && (
        <div className="msg lia">Bonjour, je suis Lia. Appuie sur le bouton, autorise le micro, puis parle-moi normalement.</div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role}`}>{m.text}</div>
      ))}
    </div>
  )
}
