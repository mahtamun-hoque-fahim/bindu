import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bindu — anonymous inbox',
  description:
    'A tiny anonymous inbox the size of a dot. Share a link, receive whispers, reply with vibes — encrypted end-to-end.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 'https://bindu.app',
  ),
  openGraph: {
    title: 'Bindu — anonymous inbox',
    description:
      'Drop a link. Read what your friends would never say to your face. End-to-end encrypted.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#FBF5EC',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=Geist:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&family=Geist+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="theme-sunset">{children}</body>
    </html>
  )
}
