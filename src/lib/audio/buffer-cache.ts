import type { Sound } from "@/data/sounds";
import { noiseBuffer } from "./noise-generators";

/** One cache per engine session, including in-flight requests. No loop-time I/O. */
export class BufferCache {
  private buffers = new Map<string, Promise<AudioBuffer>>();
  private requests = new Set<AbortController>();

  load(context: AudioContext, sound: Sound): Promise<AudioBuffer> {
    const key = sound.audioType === "file" ? sound.src : sound.noiseColor;
    const cached = this.buffers.get(key);
    if (cached) return cached;
    const task =
      sound.audioType === "file"
        ? this.loadFile(context, sound.src)
        : Promise.resolve(noiseBuffer(context, sound.noiseColor));
    const retryable = task.catch((error: unknown) => {
      this.buffers.delete(key);
      throw error;
    });
    this.buffers.set(key, retryable);
    return retryable;
  }

  private async loadFile(context: AudioContext, src: string) {
    const controller = new AbortController();
    this.requests.add(controller);
    const timeout = setTimeout(() => controller.abort(), 60000);
    try {
      const response = await fetch(src, { signal: controller.signal });
      if (!response.ok)
        throw new Error(`Audio request failed: ${response.status}`);
      const bytes = await response.arrayBuffer();
      return await context.decodeAudioData(bytes);
    } finally {
      clearTimeout(timeout);
      this.requests.delete(controller);
    }
  }

  dispose() {
    this.requests.forEach((controller) => controller.abort());
    this.requests.clear();
    this.buffers.clear();
  }
}
