import type { NarrationState, NarrationTrack } from "@/types/story";

export const NARRATION_STORAGE_KEY = "nordic-hush-narration-v1";
export const emptyNarration: NarrationState = {
  track: null,
  playing: false,
  loading: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  error: "",
};

export function readNarrationPreferences(): {
  id?: string;
  position: number;
  volume: number;
} {
  try {
    const saved: unknown = JSON.parse(
      localStorage.getItem(NARRATION_STORAGE_KEY) || "null",
    );
    if (saved && typeof saved === "object") {
      const value = saved as Record<string, unknown>;
      return {
        id: typeof value.id === "string" ? value.id : undefined,
        position:
          typeof value.position === "number" && Number.isFinite(value.position)
            ? Math.max(0, value.position)
            : 0,
        volume:
          typeof value.volume === "number" && Number.isFinite(value.volume)
            ? Math.min(1, Math.max(0, value.volume))
            : 0.8,
      };
    }
  } catch {
    /* Storage is optional. */
  }
  return { position: 0, volume: 0.8 };
}

// One lazy, reusable native streaming element, independent of Web Audio.
// The engine supplies the existing shared sleep-timer deadline.
export class NarrationChannel {
  private audio: HTMLAudioElement;
  private deadline: number | null = null;
  private timerInterval?: ReturnType<typeof setInterval>;
  private master = 0.4;
  private state: NarrationState = { ...emptyNarration };
  private revision = 0;
  private resumeAt = 0;
  private lastSaved = 0;

  constructor(
    private changed: (state: NarrationState) => void,
    private resume: () => void,
  ) {
    this.audio = new Audio();
    this.audio.preload = "none";
    this.audio.volume = 0;
    this.audio.addEventListener("loadedmetadata", this.metadata);
    this.audio.addEventListener("durationchange", this.durationChanged);
    this.audio.addEventListener("timeupdate", this.timeChanged);
    this.audio.addEventListener("playing", this.playing);
    this.audio.addEventListener("pause", this.paused);
    this.audio.addEventListener("waiting", this.waiting);
    this.audio.addEventListener("ended", this.ended);
    this.audio.addEventListener("error", this.failed);
    window.addEventListener("pagehide", this.save);
  }

  private update(patch: Partial<NarrationState>) {
    this.state = { ...this.state, ...patch };
    this.changed(this.state);
    this.syncMediaSession();
  }
  private durationChanged = () => {
    this.update({
      duration: Number.isFinite(this.audio.duration) ? this.audio.duration : 0,
    });
  };
  private metadata = () => {
    this.durationChanged();
    // An old/completed saved position starts at the beginning, never past EOF.
    this.audio.currentTime =
      this.resumeAt < this.state.duration ? this.resumeAt : 0;
    this.resumeAt = 0;
    this.timeChanged();
  };
  private timeChanged = () => {
    this.checkTimer();
    this.update({ currentTime: this.audio.currentTime });
    if (Date.now() - this.lastSaved >= 5000) this.save();
  };
  private playing = () =>
    this.update({ playing: true, loading: false, error: "" });
  private paused = () => {
    this.update({ playing: false, loading: false });
    this.save();
  };
  private waiting = () => {
    if (!this.audio.paused) this.update({ loading: true });
  };
  private ended = () => {
    this.update({ playing: false, loading: false, currentTime: 0 });
    this.save();
  };
  private failed = () => {
    this.update({
      playing: false,
      loading: false,
      error: "Narration could not load. Tap play to try again.",
    });
  };
  private save = () => {
    this.lastSaved = Date.now();
    try {
      localStorage.setItem(
        NARRATION_STORAGE_KEY,
        JSON.stringify({
          id: this.state.track?.id,
          position: this.state.currentTime,
          volume: this.state.volume,
        }),
      );
    } catch {
      /* Playback works without storage. */
    }
  };

  async play(
    track: NarrationTrack,
    position: number,
    volume: number,
    master: number,
  ) {
    const revision = ++this.revision;
    const replace =
      this.state.track?.id !== track.id ||
      this.state.track.audioSrc !== track.audioSrc;
    if (replace || this.audio.error) {
      this.audio.pause();
      this.resumeAt = position;
      this.audio.src = track.audioSrc;
      this.update({ track, currentTime: position, duration: 0 });
    } else if (this.audio.ended) this.audio.currentTime = 0;
    this.master = master;
    this.setVolume(volume);
    this.update({ loading: true, error: "" });
    try {
      // Keep native playback within the original user gesture, including Safari.
      await this.audio.play();
      if (revision === this.revision)
        this.update({ playing: !this.audio.paused, loading: false });
    } catch {
      if (revision === this.revision) {
        this.audio.pause();
        this.update({
          playing: false,
          loading: false,
          error: "Audio could not start. Tap play to try again.",
        });
      }
    }
  }

  get isPlaying() {
    return !this.audio.paused;
  }
  pause() {
    ++this.revision;
    this.audio.pause();
    this.update({ playing: false, loading: false });
    this.save();
  }
  stop() {
    this.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    this.update({ ...emptyNarration, volume: this.state.volume });
    this.save();
  }
  seek(seconds: number) {
    if (!Number.isFinite(seconds) || !this.state.duration) return;
    this.audio.currentTime = Math.min(
      this.state.duration,
      Math.max(0, seconds),
    );
    this.timeChanged();
    this.save();
  }
  setVolume(volume: number) {
    const next = Number.isFinite(volume)
      ? Math.min(1, Math.max(0, volume))
      : this.state.volume;
    this.update({ volume: next });
    this.applyGain();
    this.save();
  }
  setMaster(master: number) {
    this.master = master;
    this.applyGain();
  }
  setTimer(deadline: number | null) {
    this.deadline = deadline;
    clearInterval(this.timerInterval);
    this.timerInterval = undefined;
    if (deadline !== null)
      this.timerInterval = setInterval(this.checkTimer, 500);
    this.checkTimer();
  }
  private checkTimer = () => {
    this.applyGain();
    if (this.deadline !== null && Date.now() >= this.deadline) {
      clearInterval(this.timerInterval);
      this.timerInterval = undefined;
      if (!this.audio.paused) this.pause();
    }
  };
  private applyGain() {
    const fade = this.deadline === null
      ? 1
      : Math.min(1, Math.max(0, (this.deadline - Date.now()) / 30000));
    this.audio.volume = Math.min(1, Math.max(0, this.state.volume * this.master * fade));
  }
  private mediaActions: MediaSessionAction[] = [
    "play", "pause", "seekbackward", "seekforward", "seekto",
  ];
  private syncMediaSession() {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    if (!this.state.track) {
      session.metadata = null;
      session.playbackState = "none";
      this.clearMediaActions();
      if (session.setPositionState) session.setPositionState();
      return;
    }
    if (typeof MediaMetadata !== "undefined" &&
        session.metadata?.title !== this.state.track.title) {
      session.metadata = new MediaMetadata({
        title: this.state.track.title,
        artist: "Nordic Hush",
        album: "Nordic Hush Stories",
      });
    }
    session.playbackState = this.state.playing ? "playing" : "paused";
    const handlers: Record<string, MediaSessionActionHandler> = {
      play: () => this.resume(),
      pause: () => this.pause(),
      seekbackward: (details) => this.seek(this.audio.currentTime - (details.seekOffset ?? 10)),
      seekforward: (details) => this.seek(this.audio.currentTime + (details.seekOffset ?? 10)),
      seekto: (details) => {
        if (details.seekTime !== undefined) this.seek(details.seekTime);
      },
    };
    for (const action of this.mediaActions) {
      try { session.setActionHandler(action, handlers[action]); }
      catch { /* Individual actions may be unsupported. */ }
    }
    if (session.setPositionState && this.state.duration > 0) {
      try {
        session.setPositionState({
          duration: this.state.duration,
          playbackRate: this.audio.playbackRate,
          position: Math.min(this.state.duration, Math.max(0, this.audio.currentTime)),
        });
      } catch { /* Position reporting is optional. */ }
    }
  }
  private clearMediaActions() {
    for (const action of this.mediaActions) {
      try { navigator.mediaSession.setActionHandler(action, null); }
      catch { /* Individual actions may be unsupported. */ }
    }
  }
  dispose() {
    ++this.revision;
    this.save();
    window.removeEventListener("pagehide", this.save);
    this.audio.removeEventListener("loadedmetadata", this.metadata);
    this.audio.removeEventListener("durationchange", this.durationChanged);
    this.audio.removeEventListener("timeupdate", this.timeChanged);
    this.audio.removeEventListener("playing", this.playing);
    this.audio.removeEventListener("pause", this.paused);
    this.audio.removeEventListener("waiting", this.waiting);
    this.audio.removeEventListener("ended", this.ended);
    this.audio.removeEventListener("error", this.failed);
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.audio.load();
    clearInterval(this.timerInterval);
    if ("mediaSession" in navigator) {
      this.clearMediaActions();
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      if (navigator.mediaSession.setPositionState)
        navigator.mediaSession.setPositionState();
    }
  }
}
