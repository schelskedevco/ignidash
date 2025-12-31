import Navbar from '@/components/layout/navbar';
import Footer from '@/components/layout/footer';

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
