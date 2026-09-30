"use client";
import { useAudio } from "@/context/AudioProvider";
import { sounds } from "@/data/sounds";
export function AmbientBackground() {
  const { mix, playing } = useAudio();
  const sound = sounds.find((sound) => mix[sound.id] !== undefined);
  return (
    <div
      aria-hidden="true"
      className="ambient-background"
      style={{
        background: `radial-gradient(ellipse at 50% 0%, ${playing && sound ? sound.accent : "#8eb7a6"}0d, transparent 65%)`,
      }}
    />
  );
}
