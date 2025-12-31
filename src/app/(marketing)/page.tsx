import HeroSection from './components/hero-section';
import FeaturesSection from './components/features-section';
import AIFeatureSection from './components/ai-feature-section';
import CTASection from './components/cta-section';
import FAQSection from './components/faq-section';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <AIFeatureSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
