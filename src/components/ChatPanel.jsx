export default function ChatPanel({ messages }) {
  return (
    <div className="chat">
      {messages.length === 0 && (
        <div className="msg lia">Bonjour, je suis Lia. Partage ton écran et pose-moi une question.</div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role}`}>{m.text}</div>
      ))}
    </div>
  )
}
