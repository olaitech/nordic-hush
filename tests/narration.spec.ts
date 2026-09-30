import { test, expect } from "@playwright/test";
import { audioBundle } from "./helpers/audio-bundle";
import type { AudioEngine } from "../src/lib/audio/audio-engine";
import type { NarrationState } from "../src/types/story";

declare global {
  interface Window {
    TestAudioEngine: typeof AudioEngine;
    testEngine: AudioEngine;
    narrationState: NarrationState;
    narrationElements: HTMLAudioElement[];
    narrationContexts: AudioContext[];
    narrationGains: GainNode[];
    narrationDecodes: number;
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/stories");
  await page.evaluate(() => {
    window.narrationElements = [];
    window.narrationContexts = [];
    window.narrationGains = [];
    window.narrationDecodes = 0;
    const NativeAudio = window.Audio;
    window.Audio = class extends NativeAudio {
      constructor() {
        super();
        window.narrationElements.push(this);
      }
    };
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor() {
        super();
        window.narrationContexts.push(this);
      }
      createGain() {
        const gain = super.createGain();
        window.narrationGains.push(gain);
        return gain;
      }
      decodeAudioData(buffer: ArrayBuffer) {
        window.narrationDecodes++;
        return super.decodeAudioData(buffer);
      }
    };
  });
  await page.addScriptTag({ content: audioBundle() });
  await page.evaluate(() => {
    window.testEngine = new window.TestAudioEngine({
      loading: () => {},
      error: () => {},
      narration: (state) => {
        window.narrationState = state;
      },
    });
  });
});

test("streaming narration, independent gains, seek, pause, replacement, persistence and shared timer", async ({
  page,
}) => {
  expect(await page.evaluate(() => window.narrationElements.length)).toBe(0);
  await page.evaluate(async () => {
    const channel = window.testEngine.getNarration();
    await channel.play(
      {
        id: "test-one",
        slug: "test-one",
        title: "Test one",
        audioSrc: "/audio/rain.mp3",
      },
      0,
      0.8,
      0.4,
    );
  });
  await expect
    .poll(() => page.evaluate(() => window.narrationState.playing))
    .toBe(true);
  await expect
    .poll(() => page.evaluate(() => window.narrationState.currentTime))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.narrationDecodes)).toBe(0);
  expect(await page.evaluate(() => window.narrationElements[0].preload)).toBe(
    "none",
  );
  await page.evaluate(() => window.testEngine.getNarration().seek(5));
  await expect
    .poll(() => page.evaluate(() => window.narrationState.currentTime))
    .toBeGreaterThanOrEqual(5);
  await page.evaluate(async () => {
    await window.testEngine.play({ "brown-noise": 0.25 }, 0.4);
    window.testEngine.getNarration().setVolume(0.6);
  });
  await expect
    .poll(() => page.evaluate(() => window.narrationGains[2].gain.value))
    .toBeCloseTo(0.24, 2);
  await page.evaluate(() => window.testEngine.pause());
  await page.waitForTimeout(400);
  expect(await page.evaluate(() => window.narrationContexts[0].state)).toBe(
    "running",
  );
  expect(await page.evaluate(() => window.narrationState.playing)).toBe(true);
  await page.evaluate(() => window.testEngine.setNarrationMaster(0.2));
  await expect
    .poll(() => page.evaluate(() => window.narrationGains[2].gain.value))
    .toBeCloseTo(0.12, 2);
  await page.evaluate(() => window.testEngine.pauseNarration());
  expect(await page.evaluate(() => window.narrationState.playing)).toBe(false);
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("nordic-hush-narration-v1")!),
  );
  expect(saved).toMatchObject({ id: "test-one", volume: 0.6 });
  expect(saved.position).toBeGreaterThanOrEqual(5);
  await page.evaluate(async () => {
    await window.testEngine
      .getNarration()
      .play(
        {
          id: "test-two",
          slug: "test-two",
          title: "Test two",
          audioSrc: "/audio/wind.mp3",
        },
        0,
        0.6,
        0.4,
      );
    window.testEngine.setTimer(Date.now() + 600);
  });
  expect(await page.evaluate(() => window.narrationElements.length)).toBe(1);
  expect(await page.evaluate(() => window.narrationContexts.length)).toBe(1);
  expect(await page.evaluate(() => window.narrationState.track?.id)).toBe(
    "test-two",
  );
  await expect
    .poll(() => page.evaluate(() => window.narrationGains[1].gain.value))
    .toBeCloseTo(0, 3);
  await page.evaluate(() => window.testEngine.stop());
  expect(await page.evaluate(() => window.narrationState.playing)).toBe(false);
  await page.evaluate(() => window.testEngine.dispose());
  expect(
    await page.evaluate(() => window.narrationElements[0].getAttribute("src")),
  ).toBeNull();
  await page.reload();
  await expect(page.locator(".narration-controls")).toHaveCount(0);
});

test("a failed narration can retry and rapid replacement cannot revive the first track", async ({
  page,
}) => {
  await page.route("**/missing-narration.mp3", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.evaluate(async () => {
    await window.testEngine
      .getNarration()
      .play(
        {
          id: "bad",
          slug: "bad",
          title: "Test bad",
          audioSrc: "/missing-narration.mp3",
        },
        0,
        0.8,
        0.4,
      );
  });
  expect(await page.evaluate(() => window.narrationState.error)).not.toBe("");
  await page.evaluate(async () => {
    const channel = window.testEngine.getNarration();
    const first = channel.play(
      { id: "a", slug: "a", title: "Test A", audioSrc: "/audio/rain.mp3" },
      0,
      0.8,
      0.4,
    );
    const second = channel.play(
      { id: "b", slug: "b", title: "Test B", audioSrc: "/audio/wind.mp3" },
      0,
      0.8,
      0.4,
    );
    await Promise.all([first, second]);
  });
  await expect
    .poll(() => page.evaluate(() => window.narrationState.playing))
    .toBe(true);
  expect(await page.evaluate(() => window.narrationState.track?.id)).toBe("b");
  expect(await page.evaluate(() => window.narrationElements.length)).toBe(1);
  await page.evaluate(() => window.testEngine.getNarration().stop());
  expect(await page.evaluate(() => window.narrationState.track)).toBeNull();
  expect(await page.evaluate(() => window.narrationState.playing)).toBe(false);
  await page.evaluate(() => window.testEngine.dispose());
});
