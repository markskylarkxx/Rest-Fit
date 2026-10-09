import { Nav } from "./components/Nav";
import { Hero } from "./components/Hero";
import { Problem } from "./components/Problem";
import { Solution } from "./components/Solution";
import { AtRisk } from "./components/AtRisk";
import { AIPlans } from "./components/AIPlans";
import { MultiGym } from "./components/MultiGym";
import { AppScreenshots } from "./components/AppScreenshots";
import { HowItWorks } from "./components/HowItWorks";
import { Pricing } from "./components/Pricing";
import { FAQ } from "./components/FAQ";
import { SignupForm } from "./components/SignupForm";
import { Footer } from "./components/Footer";

export function App() {
  return (
    <div className="min-h-screen bg-canvas">
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <AtRisk />
        <AIPlans />
        <MultiGym />
        <AppScreenshots />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <SignupForm />
      </main>
      <Footer />
    </div>
  );
}