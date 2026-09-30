import { pageMetadata, site } from "@/config/site";
import { JsonLd } from "@/components/JsonLd";
import { Moon, Sparkles } from "lucide-react";
import { SoundLibrary } from "@/components/SoundLibrary";
import { Mixer } from "@/components/Mixer";
import { SleepTimer } from "@/components/SleepTimer";
export const metadata = pageMetadata(site.title, site.description, "/");
export default function Home() {
  return (
    <main id="main-content" className="main-container">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: site.name,
          url: `${site.url}/`,
        }}
      />
      <section className="hero">
        <div className="hero-orbit" aria-hidden="true">
          <Moon size={24} strokeWidth={1} />
        </div>
        <span className="eyebrow">NORDIC HUSH</span>
        <h1>
          Find your <em>quiet.</em>
        </h1>
        <p>Sounds for sleep, focus and calm.</p>
        <span className="hero-instruction">
          Choose a sound. Add another if you like.
        </span>
      </section>
      <SoundLibrary />
      <Mixer />
      <SleepTimer />
      <section className="quiet-note">
        <Sparkles size={23} strokeWidth={1.1} />
        <h2>Made for quiet moments.</h2>
        <p>
          A softer backdrop for a busy world. Simple ambient sounds for sleep,
          <br className="desktop-break" /> focus and relaxation, with nothing to
          get in the way.
        </p>
        <span>No accounts. No interruptions. Just a little quiet.</span>
      </section>
    </main>
  );
}
