"use client";
import { Moon, Pause, Play, Timer, Volume2 } from "lucide-react";
import { useAudio } from "@/context/AudioProvider";
import { sounds } from "@/data/sounds";
import { Countdown } from "./SleepTimer";

export function BottomPlayer() {
  const { mix, playing, playPause, master, setMaster, deadline, error, busy } =
    useAudio();
  const active = sounds.filter((sound) => mix[sound.id] !== undefined);
  return (
    <>
      <div className="player-message" role="status">
        {error}
      </div>
      <aside
        className={`bottom-player ${active.length ? "has-mix" : ""}`}
        aria-label="Audio player"
      >
        <div className="player-inner">
          <span className="player-symbol">
            <Moon size={22} strokeWidth={1.3} />
          </span>
          <div className="now-playing">
            <span className="eyebrow">
              {active.length
                ? playing
                  ? "YOUR QUIET, PLAYING"
                  : "YOUR MIX, READY"
                : "A MOMENT TO YOURSELF"}
            </span>
            <p>
              {active.length
                ? active.map((sound) => sound.shortName).join(" + ")
                : "Let the world slow down."}
            </p>
          </div>
          <button
            className="play-button"
            disabled={!active.length || busy}
            aria-label={playing ? "Pause all sounds" : "Play your mix"}
            onClick={playPause}
          >
            {playing ? (
              <Pause size={19} fill="currentColor" />
            ) : (
              <Play size={19} fill="currentColor" />
            )}
          </button>
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
          <a
            className="player-timer"
            href="#sleep-timer"
            aria-label="Go to sleep timer"
          >
            <Timer size={19} strokeWidth={1.4} />
            {deadline ? <Countdown /> : <span>Sleep timer</span>}
          </a>
        </div>
      </aside>
    </>
  );
}
