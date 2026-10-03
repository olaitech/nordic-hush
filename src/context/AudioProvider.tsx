"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MAX_SOUNDS, sounds, type Mix, type SoundId } from "@/data/sounds";
import { AudioEngine } from "@/lib/audio/audio-engine";
import { stories } from "@/data/stories";
import {
  emptyNarration,
  readNarrationPreferences,
  NARRATION_STORAGE_KEY,
} from "@/lib/audio/narration";
import type { NarrationState, NarrationTrack } from "@/types/story";

type Player = {
  mix: Mix;
  playing: boolean;
  master: number;
  deadline: number | null;
  timer: number;
  error: string;
  busy: boolean;
  loading: Partial<Record<SoundId, boolean>>;
  toggle: (id: SoundId) => void;
  playPause: () => void;
  setChannel: (id: SoundId, volume: number) => void;
  setMaster: (volume: number) => void;
  setTimer: (minutes: number) => void;
  remove: (id: SoundId) => void;
  narration: NarrationState;
  playNarration: (track: NarrationTrack) => void;
  pauseNarration: () => void;
  stopNarration: () => void;
  seekNarration: (seconds: number) => void;
  setNarrationVolume: (volume: number) => void;
};
const AudioContext = createContext<Player | null>(null);
const STORAGE_KEY = "nordic-hush-preferences-v1";
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function AudioProvider({ children }: { children: ReactNode }) {
  const engine = useRef<AudioEngine | null>(null);
  const [mix, updateMix] = useState<Mix>({});
  const mixRef = useRef<Mix>({});
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const [master, updateMaster] = useState(0.4);
  const [timer, updateTimer] = useState(0);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const operation = useRef(0);
  const [loading, setLoading] = useState<Partial<Record<SoundId, boolean>>>({});
  const [error, setError] = useState("");
  const [narration, setNarration] = useState<NarrationState>(emptyNarration);
  const narrationRef = useRef(narration);
  const resumeNarrationRef = useRef<() => void>(() => {});
  useEffect(() => {
    resumeNarrationRef.current = () => {
      const track = narrationRef.current.track;
      if (track) playNarration(track);
    };
  });
  function updateNarration(state: NarrationState) {
    narrationRef.current = state;
    setNarration(state);
  }

  useEffect(() => {
    let cancelled = false;
    const operationRef = operation;
    queueMicrotask(() => {
      if (cancelled) return;
      const preferences = readNarrationPreferences();
      const story = stories.find((item) => item.id === preferences.id);
      const restoredNarration: NarrationState = {
        ...emptyNarration,
        volume: preferences.volume,
        ...(story?.audioSrc
          ? {
              track: {
                id: story.id,
                slug: story.slug,
                title: story.title,
                audioSrc: story.audioSrc,
              },
              currentTime: preferences.position,
              duration: story.durationSeconds ?? 0,
            }
          : {}),
      };
      narrationRef.current = restoredNarration;
      setNarration(restoredNarration);
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (saved && typeof saved === "object") {
          const restored: Mix = {};
          for (const sound of sounds) {
            const value = saved.mix?.[sound.id];
            if (
              typeof value === "number" &&
              Number.isFinite(value) &&
              Object.keys(restored).length < MAX_SOUNDS
            )
              restored[sound.id] = clamp(value);
          }
          mixRef.current = restored;
          updateMix(restored);
          if (typeof saved.master === "number" && Number.isFinite(saved.master))
            updateMaster(clamp(saved.master));
          if ([0, 15, 30, 60, 120].includes(saved.timer))
            updateTimer(saved.timer);
        }
      } catch {
        /* Storage can be unavailable in private browsing. */
      }
      setReady(true);
    });
    return () => {
      cancelled = true;
      operationRef.current++;
      engine.current?.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mix, master, timer }));
    } catch {
      /* Playback also works without storage. */
    }
  }, [mix, master, timer, ready]);

  useEffect(() => {
    if (deadline === null) return;
    const check = () => {
      if (Date.now() >= deadline) {
        operation.current++;
        engine.current?.stop();
        playingRef.current = false;
        setPlaying(false);
        setDeadline(null);
      }
    };
    const interval = setInterval(check, 500);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", check);
    };
  }, [deadline]);

  function commit(next: Mix) {
    mixRef.current = next;
    updateMix(next);
    engine.current?.sync(next);
  }
  function getEngine() {
    engine.current ??= new AudioEngine({
      loading: (id, value) =>
        setLoading((previous) => ({ ...previous, [id]: value })),
      error: (id) => {
        remove(id);
        const name = sounds.find((sound) => sound.id === id)!.name;
        setError(
          `${name} could not load. Tap its card to try again. Other sounds can keep playing.`,
        );
      },
      narration: updateNarration,
      resumeNarration: () => resumeNarrationRef.current(),
    });
    return engine.current;
  }
  async function start(next: Mix) {
    if (pending.current) return;
    pending.current = true;
    const currentOperation = ++operation.current;
    setBusy(true);
    setError("");
    try {
      getEngine();
      const end = deadline ?? (timer ? Date.now() + timer * 60000 : null);
      engine.current!.setTimer(end);
      await engine.current!.play(next, master);
      if (currentOperation !== operation.current) return;
      playingRef.current = true;
      setPlaying(true);
      setDeadline(end);
    } catch {
      if (currentOperation !== operation.current) return;
      setError(
        "Audio could not start. Please tap play again or try another browser.",
      );
      playingRef.current = false;
      setPlaying(false);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  function remove(id: SoundId) {
    const next = { ...mixRef.current };
    delete next[id];
    commit(next);
    if (!Object.keys(next).length) {
      operation.current++;
      engine.current?.pause();
      playingRef.current = false;
      setPlaying(false);
      if (!narrationRef.current.track) {
        setDeadline(null);
        engine.current?.setTimer(null);
      }
    }
    setError("");
  }
  function toggle(id: SoundId) {
    if (pending.current) return;
    if (mixRef.current[id] !== undefined) {
      remove(id);
      return;
    }
    if (Object.keys(mixRef.current).length >= MAX_SOUNDS) {
      setError("Your mix has six sounds. Remove one to make room for another.");
      return;
    }
    const next = {
      ...mixRef.current,
      [id]: sounds.find((sound) => sound.id === id)!.defaultVolume,
    };
    commit(next);
    if (!playingRef.current) void start(next);
    else setError("");
  }
  function playPause() {
    if (pending.current) return;
    if (playingRef.current) {
      operation.current++;
      engine.current?.pause();
      playingRef.current = false;
      setPlaying(false);
    } else if (Object.keys(mixRef.current).length) void start(mixRef.current);
  }
  function setTimer(minutes: number) {
    updateTimer(minutes);
    const end =
      minutes &&
      (playingRef.current ||
        narrationRef.current.playing ||
        narrationRef.current.loading)
        ? Date.now() + minutes * 60000
        : null;
    setDeadline(end);
    engine.current?.setTimer(end);
  }
  function setMaster(volume: number) {
    updateMaster(volume);
    if (playingRef.current) engine.current?.setVolume(volume);
    else engine.current?.setNarrationMaster(volume);
  }
  function setChannel(id: SoundId, volume: number) {
    commit({ ...mixRef.current, [id]: volume });
  }

  function playNarration(track: NarrationTrack) {
    const previous = narrationRef.current;
    try {
      const audio = getEngine();
      const channel = audio.getNarration();
      const end = deadline ?? (timer ? Date.now() + timer * 60000 : null);
      audio.setTimer(end);
      setDeadline(end);
      void channel.play(
        track,
        previous.track?.id === track.id ? previous.currentTime : 0,
        previous.volume,
        master,
      );
    } catch {
      updateNarration({
        ...previous,
        error:
          "Audio could not start. Please tap play again or try another browser.",
      });
    }
  }
  function pauseNarration() {
    engine.current?.pauseNarration();
  }
  function stopNarration() {
    if (engine.current?.narrationChannel)
      engine.current.narrationChannel.stop();
    else {
      updateNarration({
        ...emptyNarration,
        volume: narrationRef.current.volume,
      });
      try {
        localStorage.setItem(
          NARRATION_STORAGE_KEY,
          JSON.stringify({ volume: narrationRef.current.volume }),
        );
      } catch {
        /* Optional. */
      }
    }
    if (!playingRef.current) {
      setDeadline(null);
      engine.current?.setTimer(null);
    }
  }
  function seekNarration(seconds: number) {
    if (engine.current?.narrationChannel)
      engine.current.narrationChannel.seek(seconds);
    else if (Number.isFinite(seconds)) {
      updateNarration({
        ...narrationRef.current,
        currentTime: Math.max(
          0,
          Math.min(narrationRef.current.duration, seconds),
        ),
      });
    }
  }
  function setNarrationVolume(volume: number) {
    if (engine.current?.narrationChannel)
      engine.current.narrationChannel.setVolume(volume);
    else {
      updateNarration({ ...narrationRef.current, volume: clamp(volume) });
      try {
        localStorage.setItem(
          NARRATION_STORAGE_KEY,
          JSON.stringify({
            id: narrationRef.current.track?.id,
            position: narrationRef.current.currentTime,
            volume: narrationRef.current.volume,
          }),
        );
      } catch {
        /* Optional. */
      }
    }
  }

  return (
    <AudioContext.Provider
      value={{
        mix,
        playing,
        master,
        deadline,
        timer,
        error,
        busy,
        loading,
        toggle,
        remove,
        playPause,
        setMaster,
        setChannel,
        setTimer,
        narration,
        playNarration,
        pauseNarration,
        stopNarration,
        seekNarration,
        setNarrationVolume,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error("Audio controls require AudioProvider");
  return context;
}
