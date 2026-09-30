"use client";
import { useAudio } from "@/context/AudioProvider";
import { formatStoryTime } from "@/lib/stories";

export function StoryProgress() {
  const { narration, seekNarration } = useAudio();
  return (
    <div className="story-progress">
      <span>{formatStoryTime(narration.currentTime)}</span>
      <input
        type="range"
        aria-label="Story progress"
        aria-valuetext={`${formatStoryTime(narration.currentTime)} of ${formatStoryTime(narration.duration)}`}
        min={0}
        max={narration.duration || 1}
        step={1}
        disabled={!narration.duration}
        value={Math.min(narration.currentTime, narration.duration)}
        onChange={(event) => seekNarration(Number(event.target.value))}
      />
      <span>{formatStoryTime(narration.duration)}</span>
    </div>
  );
}
