'use client'

import type { ReactNode } from 'react'

export function Section({
  title,
  subtitle,
  children,
  danger,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section
      style={{
        background: 'var(--bubble)',
        border: `1px solid ${danger ? '#C04A2B33' : 'var(--line)'}`,
        borderRadius: 'var(--radius-lg)',
        padding: 28,
      }}
    >
      <div style={{ marginBottom: 18 }}>
        <h2
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            margin: '0 0 4px',
            letterSpacing: '-0.015em',
            color: danger ? '#C04A2B' : 'var(--ink)',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              color: 'var(--ink-2)',
              fontSize: 13,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="eyebrow" style={{ display: 'block', marginBottom: 6 }}>
      {children}
    </label>
  )
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      style={{
        display: 'block',
        width: '100%',
        padding: '12px 16px',
        border: '1.5px solid var(--line)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        outline: 'none',
        ...props.style,
      }}
    />
  )
}

export function TextArea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      style={{
        display: 'block',
        width: '100%',
        padding: '12px 16px',
        border: '1.5px solid var(--line)',
        borderRadius: 'var(--radius)',
        background: 'var(--bg)',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
        fontSize: 15,
        outline: 'none',
        resize: 'vertical',
        minHeight: 80,
        ...props.style,
      }}
    />
  )
}

export function Note({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'ok' | 'err'
}) {
  return (
    <p
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        marginTop: 12,
        marginBottom: 0,
        color:
          tone === 'err'
            ? '#C04A2B'
            : tone === 'ok'
              ? 'var(--accent)'
              : 'var(--ink-2)',
      }}
    >
      {children}
    </p>
  )
}
