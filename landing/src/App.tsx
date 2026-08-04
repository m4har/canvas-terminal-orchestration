import { LandingThemeProvider } from "./components/theme/LandingThemeProvider";
import { MeshBackground } from "./components/MeshBackground";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { MockCanvas } from "./components/MockCanvas";
import { Features } from "./components/Features";
import { CapabilitiesBento } from "./components/CapabilitiesBento";
import { HowItWorks } from "./components/HowItWorks";
import { CtaStrip } from "./components/CtaStrip";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <LandingThemeProvider>
      <MeshBackground />
      <Navbar />
      <main>
        <Hero />
        <Marquee />
        <MockCanvas />
        <Features />
        <CapabilitiesBento />
        <HowItWorks />
        <CtaStrip />
      </main>
      <Footer />
    </LandingThemeProvider>
  );
}
