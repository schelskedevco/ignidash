import HeroSection from "./components/hero-section";
import Footer from "./components/footer";
import CTASection from "./components/cta-section";
import FAQSection from "./components/faq-section";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </>
  );
}
