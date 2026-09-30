"use client";
import { Pause, Play } from "lucide-react";
import { useAudio } from "@/context/AudioProvider";
import type { Story } from "@/types/story";
import { StoryProgress } from "./StoryProgress";

export function NarrationControls({ compact = false }: { compact?: boolean }) {
  const {
    narration,
    playNarration,
    pauseNarration,
    stopNarration,
    setNarrationVolume,
  } = useAudio();
  if (!narration.track) return null;
  return (
    <div className={`narration-controls ${compact ? "compact" : ""}`}>
      <div className="narration-actions">
        <button
          className="play-button"
          aria-label={narration.playing ? "Pause story" : "Resume story"}
          aria-busy={narration.loading}
          onClick={() =>
            narration.playing || narration.loading
              ? pauseNarration()
              : playNarration(narration.track!)
          }
        >
          {narration.playing || narration.loading ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" />
          )}
        </button>
        <button className="text-button" onClick={stopNarration}>
          Stop story
        </button>
        <label className="narration-volume">
          Narration
          <input
            type="range"
            aria-label="Narration volume"
            min={0}
            max={100}
            value={Math.round(narration.volume * 100)}
            onChange={(event) =>
              setNarrationVolume(Number(event.target.value) / 100)
            }
          />
          <output>{Math.round(narration.volume * 100)}%</output>
        </label>
      </div>
      <StoryProgress />
      {!compact && narration.error && <p role="status">{narration.error}</p>}
    </div>
  );
}

export function StoryPlayer({ story }: { story: Story }) {
  const { narration, playNarration } = useAudio();
  if (!story.audioSrc) return null;
  return (
    <section className="story-player" aria-label="Story narration">
      <h2>Story player</h2>
      {narration.track?.id === story.id ? (
        <NarrationControls />
      ) : (
        <button
          className="text-button story-start"
          onClick={() =>
            playNarration({
              id: story.id,
              slug: story.slug,
              title: story.title,
              audioSrc: story.audioSrc!,
            })
          }
        >
          Listen to {story.title} →
        </button>
      )}
    </section>
  );
}
