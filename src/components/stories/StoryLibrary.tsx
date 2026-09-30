import Link from "next/link";
import { storyCategories } from "@/data/stories";
import type { Story, StoryType } from "@/types/story";
import { StoryCard } from "./StoryCard";

export function StoryLibrary({ stories }: { stories: readonly Story[] }) {
  return (
    <>
      <div className="detail-intro">
        <span className="eyebrow">NORDIC HUSH STORIES</span>
        <h1>Sleep Stories</h1>
        <p>Slow stories for quiet nights.</p>
        <p>Choose a story, settle in, and add your own atmosphere.</p>
      </div>
      {stories.length === 0 ? (
        <div className="story-empty">
          <p>A quieter library is being prepared.</p>
          <Link className="back-link" href="/sounds">
            Find your quiet with sounds →
          </Link>
        </div>
      ) : (
        (Object.keys(storyCategories) as StoryType[]).map((type) => {
          const group = stories.filter((story) => story.type === type);
          return (
            group.length > 0 && (
              <section
                className="story-category"
                key={type}
                aria-labelledby={`stories-${type}`}
              >
                <h2 id={`stories-${type}`}>{storyCategories[type].heading}</h2>
                <div className="story-grid">
                  {group.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </section>
            )
          );
        })
      )}
    </>
  );
}
