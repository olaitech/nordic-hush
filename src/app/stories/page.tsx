import { AffiliateCallout } from "@/components/affiliate/AffiliateCallout";
import { stories } from "@/data/stories";
import { storyLibraryMetadata } from "@/lib/stories";
import { StoryLibrary } from "@/components/stories/StoryLibrary";

export function generateMetadata() {
  return storyLibraryMetadata();
}

export default function StoriesPage() {
  return (
    <main id="main-content" className="main-container detail-page stories-page">
      <StoryLibrary stories={stories} />
      <AffiliateCallout category={null} title="Listening at bedtime?" description="Explore a small collection of headphones, masks and other sleep gear selected to complement Nordic Hush stories." cta="Explore Sleep Gear" />
    </main>
  );
}
