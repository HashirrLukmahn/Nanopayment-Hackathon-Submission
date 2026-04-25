import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const serif = Source_Serif_4({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-serif",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Luqman — the dark corpus of unpublished science",
  description:
    "A pay-per-query marketplace for unpublished negative research results. Researchers get paid, per chunk, every time an AI agent learns from their work.",
  metadataBase: new URL("https://luqman.dev"),
  openGraph: {
    title: "Luqman",
    description:
      "The 90% of research that never gets published is worth more than the 10% that does.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${serif.variable} ${mono.variable} min-h-screen bg-background text-foreground antialiased`}
      >
        {/* Auth provider would wrap here (Clerk removed for hackathon demo) */}
        {children}
      </body>
    </html>
  );
}
