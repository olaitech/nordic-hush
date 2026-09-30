import { pageMetadata, site } from "@/config/site";
import { hasStories, stories } from "@/data/stories";
import type { Story } from "@/types/story";

export function storyLibraryMetadata(catalog: readonly Story[] = stories) {
  return {
    ...pageMetadata(
      "Sleep Stories for Quiet Nights | Nordic Hush",
      "Calm narrated stories for sleep and quiet evenings, with optional rain, fireplace, ocean and other ambient sounds.",
      "/stories",
    ),
    robots: { index: hasStories(catalog), follow: true },
  };
}

export function storyMetadata(story: Story) {
  return pageMetadata(
    story.seoTitle,
    story.seoDescription,
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
