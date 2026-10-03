import type { Story, StoryType } from "@/types/story";

// Only publish real, ready-to-release stories here. No sample content.
export const stories: Story[] = [
  {
    id: "the-long-winter",
    slug: "the-long-winter",
    title: "The Long Winter",
    subtitle: "A Viking-Inspired Sleep Story in Four Chapters",
    type: "original",
    description:
      "A calm fictional sleep story inspired by everyday life in the Viking Age, following a family through a long northern winter.",
    shortDescription:
      "A quiet journey through a long northern winter of firelight, snow and returning spring.",
    durationSeconds: 68 * 60,
    audioSrc: "/stories/the-long-winter/audio/THE-LONG-WINTER.mp3",
    transcriptPath: "the-long-winter/transcript.md",
    recommendedSoundIds: ["fireplace", "wind", "brown-noise"],
    disclaimer:
      "A fictional sleep story inspired by everyday life in the Viking Age.",
    seoTitle: "The Long Winter – Viking-Inspired Sleep Story | Nordic Hush",
    seoDescription:
      "Listen to The Long Winter, a calm Viking-inspired sleep story about firelight, snow, community and the return of spring.",
  },
  {
    id: "the-baker-before-sunrise",
    slug: "the-baker-before-sunrise",
    title: "The Baker Before Sunrise",
    type: "original",
    description: "",
    shortDescription: "",
    audioSrc: "/stories/the-baker-before-sunrise/audio/the-baker.mp3",
    seoTitle: "The Baker Before Sunrise | Nordic Hush",
    seoDescription: "",
  },
  {
    id: "the-tea-house-at-the-edge-of-the-forest",
    slug: "the-tea-house-at-the-edge-of-the-forest",
    title: "The Tea House at the Edge of the Forest",
    type: "original",
    description: "",
    shortDescription: "",
    audioSrc:
      "/stories/the-tea-house-at-the-edge-of-the-forest/audio/The-tea-house.mp3",
    seoTitle: "The Tea House at the Edge of the Forest | Nordic Hush",
    seoDescription: "",
  },
];

export const storyCategories: Record<
  StoryType,
  { label: string; heading: string }
> = {
  original: {
    label: "ORIGINAL NORDIC HUSH",
    heading: "Original Nordic Hush Stories",
  },
  classic: { label: "BEDTIME CLASSIC", heading: "Bedtime Classics" },
};

export function hasStories(catalog: readonly Story[] = stories) {
  return catalog.length > 0;
}

export function findStory(slug: string, catalog: readonly Story[] = stories) {
  return catalog.find((story) => story.slug === slug);
}

export function storyPaths(catalog: readonly Story[] = stories) {
  return hasStories(catalog)
    ? ["/stories", ...catalog.map((story) => `/stories/${story.slug}`)]
    : [];
}
