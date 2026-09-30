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

// One lazy, reusable streaming element in the existing engine/context.
// No fetch/decodeAudioData, loop, eager src, or independent sleep timer.
export class NarrationChannel {
  private audio: HTMLAudioElement;
  private source: MediaElementAudioSourceNode;
  private gain: GainNode;
  private master = 0.4;
  private state: NarrationState = { ...emptyNarration };
  private revision = 0;
  private resumeAt = 0;
  private lastSaved = 0;

  constructor(
    private context: AudioContext,
    output: AudioNode,
    private changed: (state: NarrationState) => void,
  ) {
    this.audio = new Audio();
    this.audio.preload = "none";
    this.source = context.createMediaElementSource(this.audio);
    this.gain = context.createGain();
    this.gain.gain.value = 0;
    this.source.connect(this.gain).connect(output);
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
      // Invoke both within the original user gesture (including Safari).
      await Promise.all([this.context.resume(), this.audio.play()]);
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
  private applyGain() {
    this.gain.gain.setTargetAtTime(
      this.state.volume * this.master,
      this.context.currentTime,
      0.08,
    );
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
    this.source.disconnect();
    this.gain.disconnect();
  }
}
