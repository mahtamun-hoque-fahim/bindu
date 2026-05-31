import { notFound } from 'next/navigation'
import { CryptoLab } from './CryptoLab'

export const runtime = 'edge'

/**
 * Dev-only crypto roundtrip lab. Hidden in production builds.
 * To enable in prod for debugging, set `BINDU_ENABLE_LAB=1`.
 */
export default function CryptoLabPage() {
  if (process.env.NODE_ENV === 'production' && !process.env.BINDU_ENABLE_LAB) {
    notFound()
  }
  return <CryptoLab />
}

export const metadata = {
  title: 'Bindu lab — crypto',
  robots: { index: false, follow: false },
}
