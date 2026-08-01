import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { MockCanvas } from "./components/MockCanvas";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { CtaStrip } from "./components/CtaStrip";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <MockCanvas />
        <Features />
        <HowItWorks />
        <CtaStrip />
      </main>
      <Footer />
    </>
  );
}
