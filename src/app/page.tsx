import HeroSection from "./components/hero-section";
import Footer from "./components/footer";
import CTASection from "./components/cta-section";
import FAQSection from "./components/faq-section";
import LogoCloud from "./components/logo-cloud";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <LogoCloud />
      <FAQSection />
      <CTASection />
      <Footer />
    </>
  );
}
