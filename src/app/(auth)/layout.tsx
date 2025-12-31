import CookieBanner from '@/components/cookie-banner';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <CookieBanner />
    </>
  );
}
