"use client";
import { SlidersHorizontal, X } from "lucide-react";
import { useAudio } from "@/context/AudioProvider";
import { sounds } from "@/data/sounds";
import { SoundIcon } from "./SoundIcon";

export function Mixer() {
  const { mix, setChannel, remove, playing, playPause, busy, loading } =
    useAudio();
  const active = sounds.filter((sound) => mix[sound.id] !== undefined);
  if (!active.length)
    return (
      <div className="empty-mix">
        <SlidersHorizontal size={17} />
        <p>Choose one or more sounds to create your mix.</p>
        <span>Up to 6 layers</span>
      </div>
    );
  return (
    <section className="mixer" aria-labelledby="mix-heading">
      <div className="section-heading">
        <h2 id="mix-heading">
          Your mix <span className="count-badge">{active.length}</span>
        </h2>
        {!playing && (
          <button className="text-button" disabled={busy} onClick={playPause}>
            Resume your last mix →
          </button>
        )}
      </div>
      <div className="mixer-channels">
        {active.map((sound) => (
          <div
            className="mixer-channel"
            key={sound.id}
            aria-busy={Boolean(loading[sound.id])}
          >
            <SoundIcon icon={sound.icon} size={21} />
            <label htmlFor={`volume-${sound.id}`}>{sound.name}</label>
            <input
              id={`volume-${sound.id}`}
              aria-label={`${sound.name} volume`}
              type="range"
              min="0"
              max="100"
              value={Math.round(mix[sound.id]! * 100)}
              onChange={(event) =>
                setChannel(sound.id, Number(event.target.value) / 100)
              }
            />
            <output>{Math.round(mix[sound.id]! * 100)}%</output>
            <button
              className="icon-button"
              aria-label={`Remove ${sound.name} from mix`}
              onClick={() => remove(sound.id)}
            >
              <X size={17} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
