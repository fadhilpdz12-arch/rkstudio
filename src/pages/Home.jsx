import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import QuickGuide from '../components/QuickGuide';
import HowItWorks from '../components/HowItWorks';
import Packages from '../components/Packages';
import Backdrops from '../components/Backdrops';
import Visit from '../components/Visit';
import { Notes, FinalCta, Footer, MobileBar } from '../components/Bits';

export default function Home({ onModelReady }) {
  return (
    <main>
      <Hero onModelReady={onModelReady} />
      <QuickGuide />
      <Gallery />
      <HowItWorks />
      <Packages />
      <Backdrops />
      <Notes />
      <Visit />
      <FinalCta />
      <Footer />
      <MobileBar />
    </main>
  );
}
