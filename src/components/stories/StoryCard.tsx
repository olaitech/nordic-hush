import Image from "next/image";
import Link from "next/link";
import { storyCategories } from "@/data/stories";
import type { Story } from "@/types/story";

export function StoryCard({ story }: { story: Story }) {
  const details = [
    story.author,
    ...(story.tags ?? []),
    story.durationSeconds
      ? `${Math.ceil(story.durationSeconds / 60)} min`
      : null,
  ].filter(Boolean);
  return (
    <article className="sound-card story-card">
      <Link href={`/stories/${story.slug}`}>
        {story.coverSrc && (
          <Image
            className="story-cover"
            src={story.coverSrc}
            alt=""
            width={64}
            height={80}
          />
        )}
        <span className="eyebrow">{storyCategories[story.type].label}</span>
        <h3>{story.title}</h3>
        <p>{story.shortDescription}</p>
        {details.length > 0 && (
          <p className="story-facts">{details.join(" · ")}</p>
        )}
        <span className="story-listen">Listen →</span>
      </Link>
    </article>
  );
}
