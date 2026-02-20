import type { Metadata, Viewport } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Figtree, Geist_Mono, Geist } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import CookieBanner from '@/components/cookie-banner';
import { getToken } from '@/lib/auth-server';

import { ConvexClientProvider } from './convex-client-provider';
import './globals.css';

const figtree = Figtree({
  variable: '--font-figtree',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const geist = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
});

const siteConfig = {
  name: 'Ignidash',
  description: 'Plan your path to Financial Independence and Early Retirement with AI-powered insights and comprehensive simulations.',
  url: 'https://www.ignidash.com',
  ogImage: 'https://www.ignidash.com/og-image.png',
  author: {
    name: 'Joe Schelske',
    url: 'https://www.linkedin.com/in/scheljos/',
  },
};

export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} - AI-Powered FIRE Calculator`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  authors: [{ name: siteConfig.author.name, url: siteConfig.author.url }],
  creator: siteConfig.author.name,
  publisher: siteConfig.name,
  manifest: '/site.webmanifest',
  metadataBase: new URL(siteConfig.url),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    siteName: siteConfig.name,
    title: `${siteConfig.name} - AI-Powered FIRE Calculator`,
    description: siteConfig.description,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - FIRE Planning Made Smarter`,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${siteConfig.name} - AI-Powered FIRE Calculator`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@schelskedevco',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  applicationName: siteConfig.name,
  category: 'personal finance',
  verification: {
    google: 'XGNdzog5t00jFc67gLOj-3wxBzTUXPos2gRlAj7rFgI',
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#27272a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://www.ignidash.com/#organization',
      name: 'Ignidash',
      url: 'https://www.ignidash.com',
      logo: 'https://www.ignidash.com/flame.svg',
      founder: { '@type': 'Person', name: 'Joe Schelske', url: 'https://www.linkedin.com/in/scheljos/' },
      sameAs: ['https://x.com/schelskedevco'],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://www.ignidash.com/#application',
      name: 'Ignidash',
      description: 'Plan your path to Financial Independence and Early Retirement with AI-powered insights and comprehensive simulations.',
      url: 'https://www.ignidash.com',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '0', priceCurrency: 'USD' },
        { '@type': 'Offer', name: 'Pro', price: '12', priceCurrency: 'USD' },
      ],
      featureList: ['Monte Carlo simulations', 'Historical backtesting', 'Tax estimation', 'AI-powered insights', 'AI chat'],
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialToken = await getToken();

  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${figtree.variable} ${geistMono.variable} ${geist.variable} h-full antialiased`}>
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConvexClientProvider initialToken={initialToken}>
            {children}
            <CookieBanner />
            {process.env.VERCEL && <Analytics />}
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
