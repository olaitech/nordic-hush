import Link from "next/link";
import { notFound } from "next/navigation";
import { findStory, stories, storyCategories } from "@/data/stories";
import {
  storyBreadcrumbs,
  storyMetadata,
  storyStructuredData,
} from "@/lib/stories";
import { readStoryTranscript } from "@/lib/story-transcript";
import { JsonLd } from "@/components/JsonLd";
import { Mixer } from "@/components/Mixer";
import { SleepTimer } from "@/components/SleepTimer";
import { StoryPlayer } from "@/components/stories/StoryPlayer";
import { StoryAtmosphere } from "@/components/stories/StoryAtmosphere";
import { StorySource } from "@/components/stories/StorySource";
import { StoryTranscript } from "@/components/stories/StoryTranscript";

export const dynamicParams = false;
export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const story = findStory((await params).slug);
  if (!story) notFound();
  return storyMetadata(story);
}

export default async function StoryPage({ params }: Props) {
  const story = findStory((await params).slug);
  if (!story) notFound();
  const transcript = await readStoryTranscript(story.transcriptPath);
  return (
    <main id="main-content" className="main-container detail-page">
      <JsonLd data={storyStructuredData(story)} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <ol>
          {storyBreadcrumbs(story).map((crumb, index) => (
            <li key={crumb.path}>
              {index === 2 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.path}>{crumb.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="detail-intro">
        <span className="eyebrow">{storyCategories[story.type].label}</span>
        <h1>{story.title}</h1>
        {story.subtitle && <p>{story.subtitle}</p>}
        {story.author && (
          <p>
            {story.type === "classic" ? "Original work by" : "By"}{" "}
            {story.author}
          </p>
        )}
        {story.durationSeconds !== undefined && story.durationSeconds > 0 && (
          <p>{Math.ceil(story.durationSeconds / 60)} min</p>
        )}
        <p>{story.shortDescription}</p>
      </div>
      <StoryPlayer story={story} />
      <StoryAtmosphere soundIds={story.recommendedSoundIds} />
      <Mixer />
      <SleepTimer />
      <Link className="back-link" href="/sounds">
        Explore all ambient sounds →
      </Link>
      <section className="sound-about">
        <h2>About this story</h2>
        {story.description.split("\n\n").map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        {story.disclaimer && <p>{story.disclaimer}</p>}
      </section>
      <StorySource story={story} />
      <StoryTranscript text={transcript} />
    </main>
  );
}
