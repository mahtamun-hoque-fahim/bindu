import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const username = searchParams.get('username') || 'someone'
  const displayName = searchParams.get('name') || username

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          background: '#0a0a0a',
          padding: '48px',
        }}
      >
        {/* Accent dot */}
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#00e676',
            marginBottom: 24,
          }}
        />

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#f5f5f5',
            textAlign: 'center',
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          Send{' '}
          <span style={{ color: '#00e676' }}>{displayName}</span>
          <br />
          an anonymous message
        </div>

        <div
          style={{
            fontSize: 20,
            color: '#888888',
            marginBottom: 40,
          }}
        >
          No account needed. Totally anonymous.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#111111',
            border: '1px solid #1f1f1f',
            borderRadius: 8,
            padding: '10px 20px',
          }}
        >
          <span style={{ color: '#888888', fontSize: 16, fontFamily: 'monospace' }}>
            bindu.app/u/{username}
          </span>
        </div>

        {/* Bindu watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 48,
            fontSize: 14,
            color: '#444',
          }}
        >
          বিন্দু · bindu.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
