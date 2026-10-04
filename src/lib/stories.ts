import { pageMetadata, site } from "@/config/site";
import { hasStories, stories } from "@/data/stories";
import type { Story } from "@/types/story";

export function storyLibraryMetadata(catalog: readonly Story[] = stories) {
  return {
    ...pageMetadata(
      "Sleep Stories for Quiet Nights | Nordic Hush",
      "Explore calm narrated sleep stories for quieter evenings. Listen at your own pace, add gentle rain or fireplace sounds, and ease into a slower bedtime routine.",
      "/stories",
    ),
    robots: { index: hasStories(catalog), follow: true },
  };
}

export function storyMetadata(story: Story) {
  // Keep SEO copy separate from the published story and audio catalog.
  const descriptions: Record<string, string> = {
    "the-baker-before-sunrise":
      "Listen to The Baker Before Sunrise, a Nordic Hush sleep story for a quieter evening. Settle into slow narration, add gentle sounds and choose a sleep timer.",
    "the-tea-house-at-the-edge-of-the-forest":
      "Listen to The Tea House at the Edge of the Forest, a Nordic Hush sleep story. Unwind with slow narration, optional ambient sounds and a gentle sleep timer.",
  };
  return pageMetadata(
    story.seoTitle,
    story.seoDescription || descriptions[story.slug],
    `/stories/${story.slug}`,
  );
}

export function storyBreadcrumbs(story: Story) {
  return [
    { name: "Home", path: "/" },
    { name: "Stories", path: "/stories" },
    { name: story.title, path: `/stories/${story.slug}` },
  ];
}

export function storyStructuredData(story: Story) {
  const breadcrumb = {
    "@type": "BreadcrumbList",
    itemListElement: storyBreadcrumbs(story).map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${site.url}${crumb.path}`,
    })),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      breadcrumb,
      ...(story.audioSrc
        ? [
            {
              "@type": "AudioObject",
              name: story.title,
              description: story.shortDescription,
              contentUrl: new URL(story.audioSrc, site.url).href,
              url: `${site.url}/stories/${story.slug}`,
              ...(story.durationSeconds && story.durationSeconds > 0
                ? { duration: `PT${story.durationSeconds}S` }
                : {}),
              ...(story.author
                ? { author: { "@type": "Person", name: story.author } }
                : {}),
            },
          ]
        : []),
    ],
  };
}

export function formatStoryTime(seconds: number) {
  const total = Math.max(0, Math.floor(Number.isFinite(seconds) ? seconds : 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
