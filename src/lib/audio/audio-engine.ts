import {
  MAX_SOUNDS,
  sounds,
  type Mix,
  type Sound,
  type SoundId,
} from "@/data/sounds";
import { createLoopVoice, type Voice } from "./loop-voice";
import { BufferCache } from "./buffer-cache";
import { NarrationChannel } from "./narration";
import type { NarrationState } from "@/types/story";

export class AudioEngine {
  private context?: AudioContext;
  private master?: GainNode;
  private timerGain?: GainNode;
  private voices = new Map<SoundId, Voice>();
  private buffers = new BufferCache();
  private pending = new Map<SoundId, object>();
  private desired: Mix = {};
  private disposed = false;
  private revision = 0;
  private deadline: number | null = null;
  private narration?: NarrationChannel;

  constructor(
    private events: {
      loading: (id: SoundId, loading: boolean) => void;
      error: (id: SoundId) => void;
      narration?: (state: NarrationState) => void;
      resumeNarration?: () => void;
    },
  ) {}

  getNarration() {
    this.narration ??= new NarrationChannel(
      (state) => this.events.narration?.(state),
      () => this.events.resumeNarration?.(),
    );
    this.narration.setTimer(this.deadline);
    return this.narration;
  }

  pauseNarration() {
    this.narration?.pause();
  }
  get narrationChannel() {
    return this.narration;
  }
  setNarrationMaster(volume: number) {
    this.narration?.setMaster(volume);
  }

  private init() {
    if (this.context) return;
    this.context = new AudioContext();
    this.master = this.context.createGain();
    this.timerGain = this.context.createGain();
    const limiter = this.context.createDynamicsCompressor();
    limiter.threshold.value = -12;
    limiter.knee.value = 8;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.3;
    this.master.gain.value = 0;
    this.master
      .connect(this.timerGain)
      .connect(limiter)
      .connect(this.context.destination);
  }

  async play(mix: Mix, volume: number) {
    const revision = ++this.revision;
    this.desired = { ...mix };
    this.init();
    await this.context!.resume();
    if (revision !== this.revision) return;
    this.sync(this.desired);
    this.setVolume(volume);
    this.setTimer(this.deadline);
  }

  sync(mix: Mix) {
    if (!this.context || !this.master) return;
    this.desired = { ...mix };
    for (const id of this.pending.keys()) {
      if (mix[id] === undefined) {
        this.pending.delete(id);
        this.events.loading(id, false);
      }
    }
    for (const [id, voice] of this.voices) {
      if (mix[id] === undefined) {
        voice.output.gain.setTargetAtTime(0, this.context.currentTime, 0.06);
        voice.dispose(
          this.context.currentTime +
            (this.context.state === "running" ? 0.25 : 0),
        );
        this.voices.delete(id);
      }
    }
    for (const sound of sounds) {
      const volume = mix[sound.id];
      if (volume === undefined) continue;
      if (!this.voices.has(sound.id)) {
        if (!this.pending.has(sound.id)) void this.loadVoice(sound);
        continue;
      }
      // Fixed headroom: adding a layer never amplifies existing layers.
      this.voices
        .get(sound.id)!
        .output.gain.setTargetAtTime(
          volume / MAX_SOUNDS,
          this.context.currentTime,
          0.25,
        );
    }
  }

  private async loadVoice(sound: Sound) {
    const token = {};
    this.pending.set(sound.id, token);
    this.events.loading(sound.id, true);
    try {
      const buffer = await this.buffers.load(this.context!, sound);
      // A removed/reselected channel has a different token. Late loads cannot revive it.
      if (this.disposed || this.pending.get(sound.id) !== token) return;
      const volume = this.desired[sound.id];
      if (volume === undefined) return;
      const voice = createLoopVoice(this.context!, buffer);
      voice.output.connect(this.master!);
      voice.output.gain.setTargetAtTime(
        volume / MAX_SOUNDS,
        this.context!.currentTime,
        0.25,
      );
      this.voices.set(sound.id, voice);
    } catch {
      if (!this.disposed && this.pending.get(sound.id) === token)
        this.events.error(sound.id);
    } finally {
      if (!this.disposed && this.pending.get(sound.id) === token) {
        this.pending.delete(sound.id);
        this.events.loading(sound.id, false);
      }
    }
  }

  setVolume(volume: number) {
    this.setNarrationMaster(volume);
    if (this.context && this.master) {
      this.master.gain.cancelAndHoldAtTime(this.context.currentTime);
      this.master.gain.setTargetAtTime(volume, this.context.currentTime, 0.08);
    }
  }

  setTimer(deadline: number | null) {
    this.deadline = deadline;
    this.narration?.setTimer(deadline);
    if (!this.context || !this.timerGain) return;
    const now = this.context.currentTime;
    const gain = this.timerGain.gain;
    gain.cancelAndHoldAtTime(now);
    if (deadline === null) {
      gain.linearRampToValueAtTime(1, now + 0.3);
      return;
    }
    const remaining = Math.max(0, (deadline - Date.now()) / 1000);
    gain.setValueAtTime(Math.min(1, remaining / 30), now);
    if (remaining > 30) gain.setValueAtTime(1, now + remaining - 30);
    gain.linearRampToValueAtTime(0, now + remaining);
  }

  stop() {
    this.narration?.pause();
    ++this.revision;
    this.desired = {};
    this.pending.forEach((_, id) => this.events.loading(id, false));
    this.pending.clear();
    this.voices.forEach((voice) => voice.dispose());
    this.voices.clear();
    void this.context?.suspend();
  }

  pause() {
    ++this.revision;
    if (!this.context || !this.master) return;
    const revision = this.revision;
    this.master.gain.cancelAndHoldAtTime(this.context.currentTime);
    this.master.gain.linearRampToValueAtTime(
      0,
      this.context.currentTime + 0.25,
    );
    setTimeout(() => {
      if (revision === this.revision && !this.narration?.isPlaying)
        void this.context?.suspend();
    }, 300);
  }

  dispose() {
    this.narration?.dispose();
    this.disposed = true;
    ++this.revision;
    this.pending.clear();
    this.buffers.dispose();
    this.voices.forEach((voice) => voice.dispose());
    this.voices.clear();
    void this.context?.close();
  }
}
