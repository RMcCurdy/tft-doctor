import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  ),
  title: "TFT Doctor",
  description:
    "Stop coinflipping your comps. Tell us your augments, emblems, and artifacts — we'll show you what high-elo players are actually running.",
  openGraph: {
    title: "TFT Doctor",
    description:
      "Stop coinflipping your comps. Tell us your augments, emblems, and artifacts — we'll show you what high-elo players are actually running.",
    siteName: "TFT Doctor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TFT Doctor",
    description:
      "Stop coinflipping your comps. Tell us your augments, emblems, and artifacts — we'll show you what high-elo players are actually running.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${outfit.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
