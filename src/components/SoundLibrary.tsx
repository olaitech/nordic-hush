"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowUpRight, Check, Plus } from "lucide-react";
import { sounds, type Sound } from "@/data/sounds";
import { useAudio } from "@/context/AudioProvider";
import { SoundIcon } from "./SoundIcon";

export function SoundCard({ sound }: { sound: Sound }) {
  const { mix, playing, toggle, busy, loading } = useAudio();
  const active = mix[sound.id] !== undefined;
  const isLoading = active && (busy || Boolean(loading[sound.id]));
  return (
    <article
      className={`sound-card ${active ? "active" : ""}`}
      style={{ "--sound-accent": sound.accent } as CSSProperties}
    >
      <button
        className="sound-toggle"
        aria-label={`${active ? "Remove" : "Play"} ${sound.name}`}
        aria-pressed={active}
        aria-busy={isLoading}
        disabled={busy}
        onClick={() => toggle(sound.id)}
      >
        <span className="card-top">
          <span className="sound-icon">
            <SoundIcon icon={sound.icon} />
          </span>
          <span className="card-action">
            {active ? <Check size={15} /> : <Plus size={16} />}
          </span>
        </span>
        <span className="sound-name">{sound.name}</span>
        <span className="sound-description">{sound.description}</span>
        <span className="sound-status">
          {active ? (
            <>
              <span className={playing ? "equalizer" : "equalizer paused"}>
                <i />
                <i />
                <i />
              </span>
              {isLoading ? "Loading…" : playing ? "Playing" : "In your mix"}
            </>
          ) : (
            "Tap to listen"
          )}
        </span>
      </button>
      <Link
        className="sound-details"
        href={`/sounds/${sound.slug}`}
        aria-label={`About ${sound.name}`}
        title={`Explore ${sound.name}`}
      >
        <span>Explore</span>
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}

export function SoundLibrary() {
  const [filter, setFilter] = useState("All sounds");
  return (
    <section id="sounds" className="library" aria-labelledby="library-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">A LITTLE LESS NOISE</span>
          <h2 id="library-heading">Choose your sound</h2>
        </div>
        <span className="layer-hint">One sound, or a world of your own.</span>
      </div>
      <div className="filter-row" aria-label="Filter sounds">
        {["All sounds", "Ambient", "Noise"].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            className={filter === value ? "selected" : ""}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
        <span className="sound-count">
          {
            sounds.filter(
              (sound) => filter === "All sounds" || sound.category === filter,
            ).length
          }{" "}
          sounds · endless quiet
        </span>
      </div>
      <div className="sound-grid">
        {sounds
          .filter(
            (sound) => filter === "All sounds" || sound.category === filter,
          )
          .map((sound) => (
            <SoundCard key={sound.id} sound={sound} />
          ))}
      </div>
    </section>
  );
}
