import type { Metadata } from "next";
import Link from "next/link";
import { SleepTimer } from "@/components/SleepTimer";
export const metadata: Metadata = {
  title: "About",
  description: "A quieter corner of the internet. Get to know Nordic Hush.",
  alternates: { canonical: "/about" },
};
export default function About() {
  return (
    <main id="main-content" className="main-container prose-page">
      <span className="eyebrow">A QUIETER CORNER</span>
      <h1>Made for quiet moments.</h1>
      <p>
        Nordic Hush is a simple collection of ambient sounds designed for sleep,
        focus and quiet moments.
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
      <Link className="text-button" href="/#sounds">
        Find your sound →
      </Link>
      <SleepTimer />
    </main>
  );
}
