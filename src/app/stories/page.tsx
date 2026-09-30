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
    </main>
  );
}
