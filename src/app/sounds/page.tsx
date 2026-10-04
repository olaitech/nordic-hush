import { AffiliateCallout } from "@/components/affiliate/AffiliateCallout";
import { pageMetadata } from "@/config/site";
import { SoundLibrary } from "@/components/SoundLibrary";
import { Mixer } from "@/components/Mixer";
import { SleepTimer } from "@/components/SleepTimer";

export const metadata = pageMetadata(
  "Ambient Sounds for Sleep & Focus | Nordic Hush",
  "Explore twelve ambient sounds for sleep, focus and quiet moments. Play rain, ocean, fireplace or noise, build your own mix and set a sleep timer.",
  "/sounds",
);

export default function SoundsPage() {
  return (
    <main id="main-content" className="main-container detail-page">
      <div className="detail-intro">
        <span className="eyebrow">THE SOUND LIBRARY</span>
        <h1>Sounds for sleep, focus and quiet moments</h1>
        <p>
          Choose a familiar background or try something new. Tap a card to
          listen, use Explore to learn about a sound, and combine up to six
          layers at your own pace.
        </p>
      </div>
      <SoundLibrary />
      <Mixer />
      <SleepTimer />
      <AffiliateCallout category={null} title="A little more comfort" description="Prefer headphones, quiet, darkness or a dedicated bedside sound machine? We keep a small collection of sleep gear selected to complement Nordic Hush." cta="Explore Sleep Gear" />
    </main>
  );
}
