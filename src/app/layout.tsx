import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { AudioProvider } from "@/context/AudioProvider";
import { Header, Footer } from "@/components/Shell";
import { BottomPlayer } from "@/components/BottomPlayer";
import { AmbientBackground } from "@/components/AmbientBackground";
import { site } from "@/config/site";
import "./globals.css";
const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: site.title,
    template: "%s | Nordic Hush",
  },
  description: site.description,
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "Nordic Hush — Find your quiet.",
    description: "Sounds for sleep, focus and calm.",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = {
  themeColor: "#080d14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={geist.variable}>
        <AudioProvider>
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          <AmbientBackground />
          <div className="site-shell">
            <Header />
            {children}
            <Footer />
          </div>
          <BottomPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
