'use client'

import { useState } from 'react'
import {
  generateRecipientKeypair,
  exportPublicJwk,
  exportPrivateJwk,
  importPublicJwk,
  generateSalt,
  deriveKek,
  wrapPrivateKey,
  unwrapPrivateKey,
  encryptToRecipient,
  decryptFromSender,
  getOrCreateDeviceId,
  resetDeviceId,
  deriveSenderHash,
  WrongPassphraseError,
  type WrappedPrivateKey,
} from '@/lib/crypto'
import { bytesToBase64 } from '@/lib/utils'

type StepResult = {
  name: string
  status: 'pending' | 'pass' | 'fail'
  detail?: string
  ms?: number
}

const DEFAULT_PLAINTEXT =
  'you give the best advice. never change. 🫶 — and this message has emoji 🔥 to test utf-8.'

export function CryptoLab() {
  const [passphrase, setPassphrase] = useState('correct horse battery staple')
  const [plaintext, setPlaintext] = useState(DEFAULT_PLAINTEXT)
  const [recipientId, setRecipientId] = useState('user_maya_k_demo_id')
  const [running, setRunning] = useState(false)
  const [steps, setSteps] = useState<StepResult[]>([])

  function update(name: string, patch: Partial<StepResult>) {
    setSteps((curr) => {
      const idx = curr.findIndex((s) => s.name === name)
      if (idx === -1) return [...curr, { name, status: 'pending', ...patch }]
      const next = [...curr]
      next[idx] = { ...next[idx], ...patch }
      return next
    })
  }

  async function time<T>(name: string, fn: () => Promise<T>): Promise<T> {
    update(name, { status: 'pending' })
    const start = performance.now()
    try {
      const result = await fn()
      update(name, { status: 'pass', ms: Math.round(performance.now() - start) })
      return result
    } catch (err) {
      update(name, {
        status: 'fail',
        detail: err instanceof Error ? err.message : String(err),
        ms: Math.round(performance.now() - start),
      })
      throw err
    }
  }

  async function runRoundtrip() {
    setSteps([])
    setRunning(true)
    try {
      // 1. Generate recipient identity keypair
      const keypair = await time('1. generateRecipientKeypair', () =>
        generateRecipientKeypair(),
      )
      const pubJwk = await time('2. exportPublicJwk', () =>
        exportPublicJwk(keypair.publicKey),
      )
      // (also export the private JWK so we can re-import for comparison later)
      await time('3. exportPrivateJwk', () => exportPrivateJwk(keypair.privateKey))

      // 4. Derive KEK from passphrase
      const salt = generateSalt()
      const kek = await time(
        '4. deriveKek (PBKDF2 × 600k)',
        () => deriveKek(passphrase, salt),
      )

      // 5. Wrap private key under KEK
      const wrapped = await time('5. wrapPrivateKey', async () => {
        const { ciphertext, iv } = await wrapPrivateKey(keypair.privateKey, kek)
        const obj: WrappedPrivateKey = {
          ciphertext,
          iv,
          salt: bytesToBase64(salt),
        }
        return obj
      })

      // 6. "Forget" the in-memory private key — simulate logout/refresh
      update('6. simulate logout (discard privateKey, KEK)', { status: 'pass' })

      // 7. Re-derive KEK with the same passphrase, unwrap
      const kek2 = await time(
        '7. re-deriveKek from passphrase',
        () => deriveKek(passphrase, salt),
      )
      const unwrappedPriv = await time(
        '8. unwrapPrivateKey (correct passphrase)',
        () => unwrapPrivateKey(wrapped, kek2),
      )

      // 9. Verify wrong passphrase rejects cleanly
      await time('9. unwrapPrivateKey (wrong passphrase → throws)', async () => {
        const badKek = await deriveKek(passphrase + '_WRONG', salt)
        try {
          await unwrapPrivateKey(wrapped, badKek)
          throw new Error('expected WrongPassphraseError, none thrown')
        } catch (err) {
          if (err instanceof WrongPassphraseError) return // expected
          throw err
        }
      })

      // 10. Sender encrypts to recipient
      const recipientPub = await time('10. importPublicJwk', () =>
        importPublicJwk(pubJwk),
      )
      const encrypted = await time(
        '11. encryptToRecipient (ECDH + AES-GCM)',
        () => encryptToRecipient(plaintext, recipientPub),
      )

      // 12. Recipient decrypts
      const decrypted = await time(
        '12. decryptFromSender',
        () => decryptFromSender(encrypted, unwrappedPriv),
      )

      // 13. Verify roundtrip
      await time('13. roundtrip equality check', async () => {
        if (decrypted !== plaintext) {
          throw new Error(
            `mismatch! got: "${decrypted.slice(0, 40)}..." expected: "${plaintext.slice(0, 40)}..."`,
          )
        }
      })

      // 14. Sender hash
      const deviceId = getOrCreateDeviceId()
      const senderHash = await time(
        '14. deriveSenderHash',
        () => deriveSenderHash(deviceId, recipientId),
      )
      update('14. deriveSenderHash', { detail: `#${senderHash}` })

      // 15. Stability — same inputs → same hash
      await time('15. senderHash stability check', async () => {
        const again = await deriveSenderHash(deviceId, recipientId)
        if (again !== senderHash) {
          throw new Error('hash unstable across calls')
        }
      })

      // 16. Per-recipient uniqueness — different recipientId → different hash
      await time('16. senderHash per-recipient uniqueness', async () => {
        const other = await deriveSenderHash(deviceId, recipientId + '_OTHER')
        if (other === senderHash) {
          throw new Error('hash did not change with recipient — bad')
        }
      })
    } catch {
      // step-level update has already captured the failure
    } finally {
      setRunning(false)
    }
  }

  function resetDevice() {
    resetDeviceId()
    update('device id reset', { status: 'pass', detail: 'localStorage cleared' })
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '40px 32px',
        maxWidth: 880,
        margin: '0 auto',
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <p className="eyebrow" style={{ marginBottom: 8 }}>
          ● dev lab · crypto
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 42,
            margin: 0,
            letterSpacing: '-0.025em',
          }}
        >
          E2E crypto roundtrip
        </h1>
        <p style={{ color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.5 }}>
          Runs the full signup → wrap → logout → unwrap → encrypt → decrypt
          arc with real WebCrypto. If every step passes, the primitives are
          good for Phase 3+.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="eyebrow">passphrase</span>
          <input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--bubble)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span className="eyebrow">recipient id</span>
          <input
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--bubble)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
            }}
          />
        </label>
      </div>

      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          marginBottom: 16,
        }}
      >
        <span className="eyebrow">plaintext</span>
        <textarea
          rows={3}
          value={plaintext}
          onChange={(e) => setPlaintext(e.target.value)}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--bubble)',
            color: 'var(--ink)',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            resize: 'vertical',
          }}
        />
      </label>

      <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
        <button
          onClick={runRoundtrip}
          disabled={running}
          className="btn accent"
          style={{
            padding: '12px 18px',
            fontSize: 14,
            opacity: running ? 0.5 : 1,
          }}
        >
          {running ? 'Running…' : 'Run roundtrip'}
        </button>
        <button onClick={resetDevice} className="btn ghost" style={{ padding: '12px 18px', fontSize: 14 }}>
          Reset device ID
        </button>
      </div>

      {steps.length > 0 && (
        <div
          style={{
            background: 'var(--bubble)',
            border: '1px solid var(--line)',
            borderRadius: 12,
            padding: 0,
            overflow: 'hidden',
          }}
        >
          {steps.map((s) => (
            <div
              key={s.name}
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: 13,
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background:
                    s.status === 'pass'
                      ? 'var(--accent)'
                      : s.status === 'fail'
                        ? '#C04A2B'
                        : 'var(--line)',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--bg)',
                  fontSize: 10,
                }}
              >
                {s.status === 'pass' ? '✓' : s.status === 'fail' ? '✕' : '·'}
              </span>
              <span style={{ flex: 1 }}>{s.name}</span>
              {s.detail && (
                <span style={{ color: 'var(--ink-2)', fontSize: 12 }}>
                  {s.detail}
                </span>
              )}
              {s.ms !== undefined && (
                <span
                  style={{
                    color: 'var(--ink-2)',
                    fontSize: 11,
                    minWidth: 60,
                    textAlign: 'right',
                  }}
                >
                  {s.ms}ms
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
