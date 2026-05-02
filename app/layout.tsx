import type { Metadata } from 'next'
import { Syne, Onest } from 'next/font/google'
import { SessionProvider } from 'next-auth/react'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400', '600', '700'] })
const onest = Onest({ subsets: ['latin'], variable: '--font-onest', weight: ['400', '500', '600'] })

export const metadata: Metadata = {
  title: 'Bindu — Anonymous Messages',
  description: 'Receive anonymous messages from anyone. No sign-up needed to send.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${onest.variable}`}>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
