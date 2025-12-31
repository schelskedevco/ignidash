import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';
import CookieBanner from '@/components/cookie-banner';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <CookieBanner />
    </>
  );
}
