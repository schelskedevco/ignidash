import Footer from '@/components/layout/footer';

import Navbar from './components/navbar';
import HeroSection from './components/hero-section';
import CTASection from './components/cta-section';
import FAQSection from './components/faq-section';
import LogoCloud from './components/logo-cloud';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <HeroSection />
      <LogoCloud />
      <FAQSection />
      <CTASection />
      <Footer />
    </>
  );
}
