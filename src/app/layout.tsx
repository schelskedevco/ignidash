import type { Metadata } from 'next';
import { Figtree, Geist_Mono, Geist } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';

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

export const metadata: Metadata = {
  title: 'Ignidash - AI-Powered Financial Planner',
  description: 'Plan your path to Financial Independence with AI-powered insights.',
  icons: '/flame.svg',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scheme-light dark:scheme-dark" suppressHydrationWarning>
      <body className={`${figtree.variable} ${geistMono.variable} ${geist.variable} h-full antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
