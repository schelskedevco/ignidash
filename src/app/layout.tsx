import type { Metadata } from "next";
import { Ubuntu } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const ubuntu = Ubuntu({
  variable: "--font-ubuntu",
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ignidash - AI-Powered FIRE Calculator",
  description:
    "Plan your path to Financial Independence with AI-powered insights. Model different FIRE strategies, plan life events, and share your journey.",
  icons: "/icon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <body className={`${ubuntu.variable} h-full antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
