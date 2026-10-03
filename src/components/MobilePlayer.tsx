"use client";

import { useEffect, useRef, useState } from "react";
import { Moon, Pause, Play, Volume2, X } from "lucide-react";
import { useAudio } from "@/context/AudioProvider";
import { sounds } from "@/data/sounds";
import { formatStoryTime } from "@/lib/stories";
import { NarrationControls } from "./stories/StoryPlayer";
import { Mixer } from "./Mixer";
import { SleepTimer } from "./SleepTimer";

export function MobilePlayer() {
  const {
    mix, playing, playPause, busy, master, setMaster,
    narration, playNarration, pauseNarration,
  } = useAudio();
  const [expanded, setExpanded] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  const active = sounds.filter((sound) => mix[sound.id] !== undefined);
  const hasAudio = Boolean(narration.track || active.length);
  const title = narration.track?.title ?? active.map((sound) => sound.shortName).join(" + ");
  const storyPlaying = narration.playing || narration.loading;
  const isPlaying = narration.track ? storyPlaying : playing;

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 601px)");
    const closeOnDesktop = () => {
      if (desktop.matches) drawer.current?.close();
    };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  useEffect(() => {
    if (!hasAudio) drawer.current?.close();
  }, [hasAudio]);

  useEffect(() => {
    if (!expanded) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [expanded]);

  function togglePlayback() {
    if (narration.track) {
      if (storyPlaying) pauseNarration();
      else playNarration(narration.track);
    } else playPause();
  }

  return (
    <>
      {hasAudio && (
        <aside className="mobile-mini-player" aria-label="Mini audio player">
          <button
            className="mini-open"
            aria-label={`Expand player: ${title}`}
            aria-haspopup="dialog"
            aria-expanded={expanded}
            aria-controls="mobile-player-drawer"
            onClick={() => { drawer.current?.showModal(); setExpanded(true); }}
          >
            <span className="player-symbol"><Moon size={20} strokeWidth={1.3} /></span>
            <span className="mini-details">
              <span className="mini-title">{title}</span>
              {narration.track && (
                <span className="mini-timeline">
                  <span>{formatStoryTime(narration.currentTime)}</span>
                  <span className="mini-progress" aria-hidden="true">
                    <span style={{ width: `${narration.duration ? Math.min(100, narration.currentTime / narration.duration * 100) : 0}%` }} />
                  </span>
                  <span>{formatStoryTime(narration.duration)}</span>
                </span>
              )}
            </span>
          </button>
          <button
            className="play-button"
            aria-label={narration.track ? isPlaying ? "Pause story" : "Resume story" : isPlaying ? "Pause all sounds" : "Play your mix"}
            aria-busy={narration.track ? narration.loading : busy}
            disabled={!narration.track && busy}
            onClick={togglePlayback}
          >
            {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
          </button>
        </aside>
      )}
      <dialog
        id="mobile-player-drawer"
        className="mobile-player-drawer"
        ref={drawer}
        aria-labelledby="mobile-player-title"
        onClose={() => setExpanded(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (event.clientY < rect.top || event.clientX < rect.left || event.clientX > rect.right)
              event.currentTarget.close();
          }
        }}
      >
        <div className="drawer-heading">
          <h2 id="mobile-player-title">{title}</h2>
          <button className="icon-button" aria-label="Close expanded player" onClick={() => drawer.current?.close()}>
            <X size={22} />
          </button>
        </div>
        {expanded && (
          <div className="drawer-controls">
            {narration.track && <NarrationControls />}
            {active.length > 0 && (
              <button className="play-button" disabled={busy} aria-label={playing ? "Pause ambient sounds" : "Play your mix"} onClick={playPause}>
                {playing ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
              </button>
            )}
            <label className="drawer-master">
              <Volume2 size={19} strokeWidth={1.4} />
              Master volume
              <input aria-label="Master volume" type="range" min={0} max={100} value={Math.round(master * 100)}
                onChange={(event) => setMaster(Number(event.target.value) / 100)} />
              <output>{Math.round(master * 100)}%</output>
            </label>
            {active.length > 0 && <Mixer idPrefix="mobile-player-" />}
            <SleepTimer idPrefix="mobile-player-" />
          </div>
        )}
      </dialog>
    </>
  );
}
