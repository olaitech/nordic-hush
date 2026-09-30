export type Voice = { output: GainNode; dispose: (when?: number) => void };

/** Source playback is independent of React and JavaScript scheduling. */
export function createLoopVoice(
  context: AudioContext,
  buffer: AudioBuffer,
): Voice {
  const source = context.createBufferSource();
  const output = context.createGain();
  source.buffer = buffer;
  source.loop = true;
  output.gain.value = 0;
  source.connect(output);
  source.start();
  let stopped = false;
  source.onended = () => {
    source.disconnect();
    output.disconnect();
  };
  return {
    output,
    dispose: (when = context.currentTime) => {
      if (stopped) return;
      stopped = true;
      source.stop(when);
      if (when <= context.currentTime) {
        source.disconnect();
        output.disconnect();
      }
    },
  };
}
