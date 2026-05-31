export function Logos() {
  const groups = [
    "the english dept",
    "swim team '26",
    "comp sci girlies",
    'ceramics club',
    'year 13',
    'the silent group chat',
  ]
  return (
    <section style={{ padding: '40px 0 60px' }}>
      <div className="container" style={{ textAlign: 'center' }}>
        <p className="eyebrow" style={{ marginBottom: 24 }}>
          ● seen in the group chats of
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 48,
            flexWrap: 'wrap',
            fontFamily: 'var(--font-display)',
            fontSize: 22,
            color: 'var(--ink-2)',
            opacity: 0.75,
          }}
        >
          {groups.map((t) => (
            <span key={t} style={{ fontStyle: 'italic' }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
