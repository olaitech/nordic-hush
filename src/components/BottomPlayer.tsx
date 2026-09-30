"use client";
import { Moon, Pause, Play, Timer, Volume2 } from "lucide-react";
import { useAudio } from "@/context/AudioProvider";
import { sounds } from "@/data/sounds";
import { Countdown } from "./SleepTimer";
import Link from "next/link";
import { NarrationControls } from "./stories/StoryPlayer";

export function BottomPlayer() {
  const {
    mix,
    playing,
    playPause,
    master,
    setMaster,
    deadline,
    error,
    busy,
    narration,
  } = useAudio();
  const active = sounds.filter((sound) => mix[sound.id] !== undefined);
  return (
    <>
      <div className="player-message" role="status">
        {error || narration.error}
      </div>
      <aside
        className={`bottom-player ${active.length ? "has-mix" : ""} ${narration.track ? "has-narration" : ""}`}
        aria-label="Audio player"
      >
        <div className="player-inner">
          <span className="player-symbol">
            <Moon size={22} strokeWidth={1.3} />
          </span>
          <div className="now-playing">
            <span className="eyebrow">
              {narration.track
                ? "NOW LISTENING"
                : active.length
                  ? playing
                    ? "YOUR QUIET, PLAYING"
                    : "YOUR MIX, READY"
                  : "A MOMENT TO YOURSELF"}
            </span>
            <p>
              {narration.track ? (
                <Link href={`/stories/${narration.track.slug}`}>
                  {narration.track.title}
                </Link>
              ) : active.length ? (
                active.map((sound) => sound.shortName).join(" + ")
              ) : (
                "Let the world slow down."
              )}
            </p>
          </div>
          {(!narration.track || active.length > 0) && (
            <button
              className="play-button"
              disabled={!active.length || busy}
              aria-label={
                playing
                  ? narration.track
                    ? "Pause ambient sounds"
                    : "Pause all sounds"
                  : "Play your mix"
              }
              onClick={playPause}
            >
              {playing ? (
                <Pause size={19} fill="currentColor" />
              ) : (
                <Play size={19} fill="currentColor" />
              )}
            </button>
          )}
          <div className="master-volume">
            <Volume2 size={19} strokeWidth={1.4} />
            <input
              aria-label="Master volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(master * 100)}
              onChange={(event) => setMaster(Number(event.target.value) / 100)}
            />
            <output>{Math.round(master * 100)}%</output>
          </div>
          <Link
            className="player-timer"
            href={
              narration.track
                ? `/stories/${narration.track.slug}#sleep-timer`
                : "#sleep-timer"
            }
            aria-label="Go to sleep timer"
          >
            <Timer size={19} strokeWidth={1.4} />
            {deadline ? <Countdown /> : <span>Sleep timer</span>}
          </Link>
        </div>
        {narration.track && (
          <div className="persistent-narration">
            <NarrationControls compact />
          </div>
        )}
      </aside>
    </>
  );
}
