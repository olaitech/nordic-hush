export type NoiseColor = "white" | "pink" | "brown";

export function noiseBuffer(
  context: BaseAudioContext,
  color: NoiseColor,
): AudioBuffer {
  const buffer = context.createBuffer(
    1,
    context.sampleRate * 12,
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  let brown = 0;
  const b = new Float64Array(7);
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    if (color === "brown") {
      brown = (brown + 0.02 * white) / 1.02;
      data[i] = brown * 3.5;
    } else if (color === "pink") {
      b[0] = 0.99886 * b[0] + white * 0.0555179;
      b[1] = 0.99332 * b[1] + white * 0.0750759;
      b[2] = 0.969 * b[2] + white * 0.153852;
      b[3] = 0.8665 * b[3] + white * 0.3104856;
      b[4] = 0.55 * b[4] + white * 0.5329522;
      b[5] = -0.7616 * b[5] - white * 0.016898;
      data[i] =
        (b[0] + b[1] + b[2] + b[3] + b[4] + b[5] + b[6] + white * 0.5362) *
        0.11;
      b[6] = white * 0.115926;
    } else data[i] = white * 0.5;
  }
  // Blend the seam without fading the whole loop to silence.
  const seam = 256;
  for (let i = 0; i < seam; i++) {
    const ratio = i / seam;
    data[data.length - seam + i] =
      data[data.length - seam + i] * (1 - ratio) + data[i] * ratio;
  }
  return buffer;
}
