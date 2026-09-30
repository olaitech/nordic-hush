import type { SoundId } from "@/data/sounds";

export type StoryType = "original" | "classic";

export type Story = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  type: StoryType;
  author?: string;
  description: string;
  shortDescription: string;
  durationSeconds?: number;
  audioSrc?: string;
  coverSrc?: string;
  transcriptPath?: string;
  tags?: string[];
  recommendedSoundIds?: SoundId[];
  seoTitle: string;
  seoDescription: string;
  source?: {
    label?: string;
    url?: string;
    publicDomain?: boolean;
    note?: string;
  };
  disclaimer?: string;
};

export type NarrationTrack = Pick<Story, "id" | "title" | "slug"> & {
  audioSrc: string;
};

export type NarrationState = {
  track: NarrationTrack | null;
  playing: boolean;
  loading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string;
};
