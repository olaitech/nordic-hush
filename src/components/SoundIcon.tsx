import {
  AudioLines,
  CloudLightning,
  CloudRain,
  Flame,
  Trees,
  Waves,
  Wind,
} from "lucide-react";
import type { Sound } from "@/data/sounds";

export function SoundIcon({
  icon,
  size = 28,
}: {
  icon: Sound["icon"];
  size?: number;
}) {
  const Icon = {
    rain: CloudRain,
    ocean: Waves,
    forest: Trees,
    fireplace: Flame,
    thunder: CloudLightning,
    wind: Wind,
    brown: AudioLines,
    pink: AudioLines,
    white: AudioLines,
  }[icon];
  return <Icon size={size} strokeWidth={1.35} aria-hidden="true" />;
}
