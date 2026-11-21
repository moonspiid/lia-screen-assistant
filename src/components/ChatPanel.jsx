export default function ChatPanel({ messages }) {
  return (
    <div className="chat">
      {messages.length === 0 && (
        <div className="msg lia">Hi, I am Lia. Press the button, allow the microphone, then talk to me normally.</div>
      )}
      {messages.map((m, i) => (
        <div key={i} className={`msg ${m.role}`}>{m.text}</div>
      ))}
    </div>
  )
}
