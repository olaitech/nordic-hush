import { pageMetadata } from "@/config/site";
import Link from "next/link";
import { SleepTimer } from "@/components/SleepTimer";
export const metadata = pageMetadata(
  "About | Nordic Hush",
  "Get to know Nordic Hush, a quiet collection of calming sounds and slow sleep stories. Discover a simple way to unwind, made for relaxation and everyday rest.",
  "/about",
);
export default function About() {
  return (
    <main id="main-content" className="main-container prose-page">
      <span className="eyebrow">A QUIETER CORNER</span>
      <h1>Made for quiet moments.</h1>
      <p>
        Nordic Hush is a collection of calming sounds and slow stories designed
        to make the transition from a busy day to a quieter night a little easier.
      </p>
      <p>
        Choose the rain on a window, the slow rhythm of the ocean, or a steady
        wash of noise. Listen to one, or bring a few together. There is no right
        mix. Only what feels comfortable to you.
      </p>
      <h2>Simple by design.</h2>
      <p>
        No accounts, subscriptions or distracting feeds. Your preferences stay
        in your browser, and sound only begins when you press play.
      </p>
      <h2>A small beginning.</h2>
      <p>
        Our ambient collection uses licensed recordings of rain, water, woods
        and weather. White, pink and brown noise are generated in your browser.
        Mix them into a background for your day, without promises of medical
        benefits.
      </p>
      <h2>Made by Across-IT.</h2>
      <p>
        Nordic Hush was created by <a href="https://across-it.no/">Across-IT</a>.
        Nordic Hush is designed for relaxation and general wellness and is not
        a substitute for medical care.
      </p>
      <p>
        Visit our <Link href="/faq">frequently asked questions</Link> for help
        with listening, mixing sounds and using the sleep timer.
      </p>
      <Link className="text-button" href="/sounds">
        Find your sound →
      </Link>
      <SleepTimer />
    </main>
  );
}
