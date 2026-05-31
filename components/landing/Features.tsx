import type { ReactNode } from 'react'

function FeatureCard({
  title,
  desc,
  big,
  visual,
}: {
  title: string
  desc: string
  big?: boolean
  visual?: ReactNode
}) {
  return (
    <div
      style={{
        gridRow: big ? 'span 2' : 'auto',
        background: 'var(--bubble)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <h3
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: big ? 30 : 22,
          margin: '0 0 8px',
          letterSpacing: '-0.015em',
          lineHeight: 1.05,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--ink-2)',
          margin: 0,
          lineHeight: 1.45,
          fontSize: 14,
          maxWidth: 340,
        }}
      >
        {desc}
      </p>
      {visual && (
        <div style={{ flex: 1, marginTop: 18, position: 'relative' }}>
          {visual}
        </div>
      )}
    </div>
  )
}

function LinkVisual() {
  const platforms = [
    {
      name: 'instagram',
      color: 'linear-gradient(135deg, #F58529, #DD2A7B, #8134AF)',
    },
    { name: 'tiktok', color: '#000' },
    { name: 'snap', color: '#FFFC00' },
    { name: 'discord', color: '#5865F2' },
    { name: 'bereal', color: '#000' },
  ]
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: 'var(--accent)',
          }}
        />
        <span style={{ color: 'var(--ink-2)' }}>bindu.app/</span>
        <span>maya.k</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--ink-2)' }}>
          copy ↗
        </span>
      </div>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          gap: 8,
        }}
      >
        {platforms.map((p, i) => (
          <div
            key={p.name}
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: p.color,
              transform: `rotate(${(i - 2) * 6}deg)`,
              border: '1px solid var(--line)',
              boxShadow: '0 4px 12px -4px var(--ink)',
            }}
          />
        ))}
      </div>
    </div>
  )
}

function MuteVisual() {
  const items = [
    { t: 'ur outfit was sick yesterday', muted: false, mood: '🔥' },
    { t: '[blocked: contains slur]', muted: true },
    { t: 'we should hang more', muted: false, mood: '🫶' },
    { t: '[muted by your filter]', muted: true },
  ]
  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {items.map((m, i) => (
        <div
          key={i}
          style={{
            background: m.muted ? 'transparent' : 'var(--bg)',
            border: '1px dashed var(--line)',
            borderRadius: 14,
            padding: '8px 12px',
            marginBottom: 6,
            fontSize: 12,
            opacity: m.muted ? 0.4 : 1,
            fontFamily: m.muted ? 'var(--font-mono)' : 'inherit',
            color: m.muted ? 'var(--ink-2)' : 'var(--ink)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {m.mood && <span>{m.mood}</span>}
          {m.t}
        </div>
      ))}
    </div>
  )
}

export function Features() {
  return (
    <section id="features">
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            alignItems: 'end',
            marginBottom: 48,
          }}
        >
          <div>
            <p className="eyebrow" style={{ marginBottom: 14 }}>
              ● features
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(38px, 5vw, 64px)',
                margin: 0,
                lineHeight: 1,
                letterSpacing: '-0.025em',
              }}
            >
              Built for the way teens actually talk.
            </h2>
          </div>
          <p
            style={{
              color: 'var(--ink-2)',
              margin: 0,
              lineHeight: 1.5,
              fontSize: 16,
            }}
          >
            Not another social network. A dot-sized inbox that lives in your
            bio and stays out of your way.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr',
            gridAutoRows: 240,
            gap: 18,
          }}
          className="features-grid"
        >
          <FeatureCard
            big
            title="One link, every platform"
            desc="bindu.app/you works in TikTok, Insta, Snap, BeReal, Discord — anywhere you have a profile."
            visual={<LinkVisual />}
          />
          <FeatureCard
            title="Mood replies"
            desc="React to whispers with a single tap. 🫶 🔥 👀 — say it without saying it."
          />
          <FeatureCard
            title="Story-ready"
            desc="Export any message to a vertical card sized for stories. One tap, gone."
          />
          <FeatureCard
            title="Group dots"
            desc="Pool messages with up to 8 friends. One inbox, everyone replies. (coming v2)"
          />
          <FeatureCard
            big
            title="Mute. Block. Disappear."
            desc="Block any sender by hash. Disappear your bindu link forever, no questions asked."
            visual={<MuteVisual />}
          />
          <FeatureCard
            title="School-safe"
            desc="On-device language filter blocks slurs, doxxing, and self-harm content before you ever see it."
          />
        </div>
      </div>
    </section>
  )
}
