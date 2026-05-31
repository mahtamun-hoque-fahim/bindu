import { TopNav } from '@/components/landing/TopNav'
import { Hero } from '@/components/landing/Hero'
import { Logos } from '@/components/landing/Logos'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Features } from '@/components/landing/Features'
import { Privacy } from '@/components/landing/Privacy'
import { DashboardsPreview } from '@/components/landing/DashboardsPreview'
import { FAQ } from '@/components/landing/FAQ'
import { FinalCTA } from '@/components/landing/FinalCTA'
import { Footer } from '@/components/landing/Footer'

export const runtime = 'edge'

export default function HomePage() {
  return (
    <>
      <TopNav />
      <Hero />
      <Logos />
      <HowItWorks />
      <Features />
      <Privacy />
      <DashboardsPreview />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  )
}
