import type { Metadata } from "next";
import { Inter, Source_Serif_4, JetBrains_Mono } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: "/luqman_logo.png",
    shortcut: "/luqman_logo.png",
    apple: "/luqman_logo.png",
  },
  openGraph: {
    title: "Luqman",
    description:
      "The 90% of research that never gets published is worth more than the 10% that does.",
    type: "website",
    images: [{ url: "/logo.svg", width: 200, height: 200 }],
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
