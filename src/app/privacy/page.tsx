import type { Metadata } from "next";
import { SleepTimer } from "@/components/SleepTimer";
export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How Nordic Hush stores playback preferences locally in your browser.",
  alternates: { canonical: "/privacy" },
};
export default function Privacy() {
  return (
    <main id="main-content" className="main-container prose-page">
      <span className="eyebrow">KEEPING THINGS SIMPLE</span>
      <h1>Your quiet. Your space.</h1>
      <p>
        This initial version of Nordic Hush stores your chosen sounds, their
        volumes, your master volume and your timer preference in your browser’s
        local storage.
      </p>
      <h2>What stays on your device</h2>
      <p>
        These preferences let you resume your last mix with a tap. Audio does
        not start automatically. We do not send your saved mix to a server. You
        can remove these preferences by clearing this site’s data in your
        browser settings.
      </p>
      <h2>No accounts or tracking scripts</h2>
      <p>
        The app does not include advertising, analytics trackers or user
        accounts. Ambient recordings are downloaded from this site when
        selected; noise sounds are generated on your device. The hosting
        provider may process standard request information, such as IP addresses
        and browser details, to deliver the website.
      </p>
      <h2>About this notice</h2>
      <p>
        This notice describes the current MVP. If features or data practices
        change, this page should be updated to reflect them.
      </p>
      <SleepTimer />
    </main>
  );
}
