import SiteHeader from './components/layout/SiteHeader'
import HeroSection from './components/layout/HeroSection'
import SiteFooter from './components/layout/SiteFooter'
import RaceMountainPath from './components/RaceMountainPath'
import { RACES, CURRENT_KM, FINAL_PEAK_KM, ASSOCIATION_URL, ADD_KM_URL, TOTAL_DONATIONS } from './data/races'

export default function App() {
  return (
    <>
      <SiteHeader />
      <main>
        <HeroSection onDonate={ASSOCIATION_URL} onAddKm={ADD_KM_URL} />
        <RaceMountainPath
          races={RACES}
          currentKm={CURRENT_KM}
          finalPeakKm={FINAL_PEAK_KM}
          totalDonations={TOTAL_DONATIONS}
          onDonate={ASSOCIATION_URL}
          onAddKm={ADD_KM_URL}
        />
      </main>
      <SiteFooter />
    </>
  )
}
