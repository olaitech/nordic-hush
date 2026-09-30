import { test, expect } from "@playwright/test";
import { sounds } from "../src/data/sounds";

declare global {
  interface Window {
    audioContexts: AudioContext[];
    audioGains: GainNode[];
    audioSources: AudioBufferSourceNode[];
    endedSources: number[];
    stoppedSources: number[];
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.audioContexts = [];
    window.audioGains = [];
    window.audioSources = [];
    window.endedSources = [];
    window.stoppedSources = [];
    const NativeContext = window.AudioContext;
    window.AudioContext = class extends NativeContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        window.audioContexts.push(this);
      }
      createGain() {
        const gain = super.createGain();
        window.audioGains.push(gain);
        return gain;
      }
      createBufferSource() {
        const source = super.createBufferSource();
        const index = window.audioSources.push(source) - 1;
        const stop = source.stop.bind(source);
        source.stop = (when?: number) => {
          window.stoppedSources.push(index);
          stop(when);
        };
        source.addEventListener("ended", () => window.endedSources.push(index));
        return source;
      }
    };
  });
});

test("mixing, real audio output, keyboard sliders, navigation, pause and persisted restoration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Play your mix", exact: true }),
  ).toBeDisabled();
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(0);
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await page
    .getByRole("button", { name: "Play Distant Thunder", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("button", { name: "Remove Distant Thunder", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("slider", { name: "Rain volume", exact: true }),
  ).toHaveValue("45");
  const slider = page.getByRole("slider", { name: "Rain volume", exact: true });
  await slider.focus();
  await slider.press("ArrowLeft");
  await expect(slider).toHaveValue("44");
  const master = page.getByRole("slider", { name: "Master volume" });
  await master.focus();
  await master.press("ArrowRight");
  await expect(master).toHaveValue("41");
  const rms = await page.evaluate(async () => {
    const analyser = window.audioContexts[0].createAnalyser();
    window.audioGains[1].connect(analyser);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const samples = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(samples);
    analyser.disconnect();
    return Math.sqrt(
      samples.reduce((sum, sample) => sum + sample * sample, 0) /
        samples.length,
    );
  });
  expect(rms).toBeGreaterThan(0.00001);
  expect(rms).toBeLessThan(0.2);
  await page
    .getByRole("button", { name: "Set sleep timer to 15 min", exact: true })
    .click();
  await page.getByRole("link", { name: "About Rain", exact: true }).click();
  await expect(page).toHaveURL("/sounds/rain-sounds-for-sleeping");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Rain Sounds for Sleeping",
  );
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(1);
  expect(await page.evaluate(() => window.audioContexts[0].state)).toBe(
    "running",
  );
  await expect(page.locator(".circular-timer.is-running")).toBeVisible();
  await page.getByRole("button", { name: "Pause all sounds" }).click();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("suspended");
  await page
    .getByRole("button", { name: "Play your mix", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("running");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Play your mix", exact: true }),
  ).toBeEnabled();
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(0);
  await expect(
    page.getByRole("slider", { name: "Rain volume", exact: true }),
  ).toHaveValue("44");
  await expect(page.getByRole("slider", { name: "Master volume" })).toHaveValue(
    "41",
  );
  await expect(
    page.getByRole("button", {
      name: "Set sleep timer to 15 min",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "Play your mix", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Fireplace", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Brown Noise", exact: true })
    .click();
  await expect(page.locator(".mixer-channel")).toHaveCount(4);
  await expect(
    page.getByRole("button", { name: "Remove Fireplace", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  await expect(
    page.getByRole("button", { name: "Remove Brown Noise", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  const sourceCount = await page.evaluate(() => window.audioSources.length);
  await page
    .getByRole("link", { name: "Nordic Hush home", exact: true })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.locator(".mixer-channel")).toHaveCount(4);
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(1);
  expect(await page.evaluate(() => window.audioSources.length)).toBe(
    sourceCount,
  );
  expect(await page.evaluate(() => window.audioContexts[0].state)).toBe(
    "running",
  );
  expect(errors).toEqual([]);
});

test("ambient and procedural sounds generate, six-layer limit, removal and filters", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of [
    "Rain",
    "Ocean",
    "Forest",
    "Fireplace",
    "Distant Thunder",
    "Wind",
  ])
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
  await expect(page.locator(".mixer-channel")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Play Brown Noise", exact: true })
    .click();
  await expect(page.locator(".player-message")).toContainText("six sounds");
  await expect(page.locator(".mixer-channel")).toHaveCount(6);
  for (const name of [
    "Rain",
    "Ocean",
    "Forest",
    "Fireplace",
    "Distant Thunder",
    "Wind",
  ])
    await page
      .getByRole("button", { name: `Remove ${name} from mix`, exact: true })
      .click();
  await expect(
    page.getByRole("button", { name: "Play your mix", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Noise", exact: true }).click();
  await expect(page.locator(".sound-card")).toHaveCount(3);
  for (const name of ["Brown Noise", "Pink Noise", "White Noise"])
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
  await expect(page.locator(".mixer-channel")).toHaveCount(3);
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(1);
});

test("timer performs an actual audio gain fade, expires, and can be cancelled", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  for (const name of ["Rain", "Fireplace", "Brown Noise"]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Remove ${name}`, exact: true }),
    ).toHaveAttribute("aria-busy", "false", { timeout: 20000 });
  }
  expect(await page.evaluate(() => window.audioSources.length)).toBe(3);
  await page
    .getByRole("button", { name: "Set sleep timer to 15 min", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel timer", exact: true }).click();
  await expect(page.getByRole("button", { name: "No timer" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page
    .getByRole("button", { name: "Set sleep timer to 15 min", exact: true })
    .click();
  await page.clock.fastForward(880000);
  // Reconcile the remaining wall-clock deadline with the audio clock after a pause.
  await page.getByRole("button", { name: "Pause all sounds" }).click();
  await page
    .getByRole("button", { name: "Play your mix", exact: true })
    .click();
  // AudioParam scheduling is applied by the audio thread, after the UI resumes.
  await expect
    .poll(() => page.evaluate(() => window.audioGains[1].gain.value))
    .toBeLessThan(0.85);
  const first = await page.evaluate(() => window.audioGains[1].gain.value);
  expect(first).toBeGreaterThan(0.45);
  expect(first).toBeLessThan(0.85);
  await page.waitForTimeout(2200);
  const later = await page.evaluate(() => window.audioGains[1].gain.value);
  expect(later).toBeLessThan(first - 0.04);
  expect(
    await page.evaluate(() =>
      window.audioSources.every((source) => source.loop),
    ),
  ).toBe(true);
  expect(await page.evaluate(() => window.endedSources)).toEqual([]);
  await page.clock.fastForward(25000);
  await expect(
    page.getByRole("button", { name: "Play your mix", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("suspended");
  await expect(page.locator(".circular-timer.is-running")).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => window.stoppedSources.length))
    .toBe(3);
});

test("360px mobile layout, metadata and supporting pages", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
  expect(
    await page
      .locator(".sound-grid")
      .evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length,
      ),
  ).toBe(2);
  const card = await page
    .getByRole("button", { name: "Play Rain", exact: true })
    .boundingBox();
  expect(card!.y).toBeLessThan(600);
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await page
    .getByRole("button", { name: "Set sleep timer to 30 min", exact: true })
    .click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
  await page.screenshot({ path: "artifacts/mobile-mix.png", fullPage: true });
  await page.goto("/sounds/brown-noise-for-sleep");
  await expect(page).toHaveTitle("Brown Noise for Sleep & Focus | Nordic Hush");
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://nordic-hush.com/sounds/brown-noise-for-sleep",
  );
  await page.goto("/about");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Made for quiet",
  );
  await page.goto("/privacy");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Your space",
  );
  await page.goto("/sounds/missing");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Nothing here",
  );
});

test("four channels have independent gains, share the master, and retain sources on pause/navigation", async ({
  page,
}) => {
  await page.goto("/");
  for (const name of ["Rain", "Ocean", "Fireplace", "Brown Noise"]) {
    await page
      .getByRole("button", { name: `Play ${name}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Remove ${name}`, exact: true }),
    ).toHaveAttribute("aria-busy", "false", { timeout: 20000 });
  }
  expect(await page.evaluate(() => window.audioSources.length)).toBe(4);
  expect(
    await page.evaluate(() =>
      window.audioSources.every((source) => source.loop),
    ),
  ).toBe(true);
  await page
    .getByRole("slider", { name: "Rain volume", exact: true })
    .fill("70");
  await expect(
    page.getByRole("slider", { name: "Ocean volume", exact: true }),
  ).toHaveValue("40");
  await expect
    .poll(() => page.evaluate(() => window.audioGains[2].gain.value))
    .toBeCloseTo(0.7 / 6, 3);
  expect(
    await page.evaluate(() => window.audioGains[3].gain.value),
  ).toBeCloseTo(0.4 / 6, 3);
  await page.getByRole("slider", { name: "Master volume" }).fill("25");
  await expect
    .poll(() => page.evaluate(() => window.audioGains[0].gain.value))
    .toBeCloseTo(0.25, 2);
  await expect(
    page.getByRole("slider", { name: "Rain volume", exact: true }),
  ).toHaveValue("70");
  await page.getByRole("button", { name: "Pause all sounds" }).click();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("suspended");
  await page
    .getByRole("button", { name: "Play your mix", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("running");
  expect(await page.evaluate(() => window.audioSources.length)).toBe(4);
  await page.getByRole("link", { name: "About Rain", exact: true }).click();
  await expect(page).toHaveURL("/sounds/rain-sounds-for-sleeping");
  expect(await page.evaluate(() => window.audioSources.length)).toBe(4);
  expect(await page.evaluate(() => window.audioContexts.length)).toBe(1);
  await page
    .getByRole("button", { name: "Remove Rain from mix", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.endedSources))
    .toEqual([0]);
  await expect(page.locator(".mixer-channel")).toHaveCount(3);
  expect(await page.evaluate(() => window.audioContexts[0].state)).toBe(
    "running",
  );
});

test("Rain loops across two complete recordings without refetching or creating new sources", async ({
  page,
}) => {
  let requests = 0;
  page.on("request", (request) => {
    if (request.url().endsWith("/audio/rain.mp3")) requests++;
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "false", { timeout: 20000 });
  const duration = await page.evaluate(() => {
    const source = window.audioSources[0];
    // Accelerate the real decoded recording in this test only. Production stays at 1x.
    source.playbackRate.value = 64;
    return source.buffer!.duration;
  });
  await test.info().attach("rain-duration", {
    body: `${duration} seconds; loop test at 64x`,
    contentType: "text/plain",
  });
  await page.waitForTimeout(((duration * 2) / 64 + 1) * 1000);
  expect(await page.evaluate(() => window.endedSources)).toEqual([]);
  expect(await page.evaluate(() => window.audioSources.length)).toBe(1);
  expect(requests).toBe(1);
  const peak = await page.evaluate(async () => {
    const analyser = window.audioContexts[0].createAnalyser();
    window.audioGains[1].connect(analyser);
    await new Promise((resolve) => setTimeout(resolve, 200));
    const values = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(values);
    window.audioGains[1].disconnect(analyser);
    return Math.max(...values.map(Math.abs));
  });
  expect(peak).toBeGreaterThan(0.00001);
  await page.getByRole("button", { name: "Remove Rain", exact: true }).click();
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "false");
  expect(requests).toBe(1);
  expect(
    await page.evaluate(
      () => window.audioSources[0].buffer === window.audioSources[1].buffer,
    ),
  ).toBe(true);
});

test("late loads cannot revive removed channels; repeated selection shares one request and source", async ({
  page,
}) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let requests = 0;
  await page.route("**/audio/rain.mp3", async (route) => {
    requests++;
    const response = await route.fetch();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play Brown Noise", exact: true })
    .click();
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Remove Rain", exact: true }).click();
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await page
    .getByRole("slider", { name: "Rain volume", exact: true })
    .fill("20");
  await page.getByRole("button", { name: "Pause all sounds" }).click();
  await expect
    .poll(() => page.evaluate(() => window.audioContexts[0].state))
    .toBe("suspended");
  release();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "false", { timeout: 20000 });
  expect(await page.evaluate(() => window.audioContexts[0].state)).toBe(
    "suspended",
  );
  expect(await page.evaluate(() => window.audioSources.length)).toBe(2);
  expect(requests).toBe(1);
  await page
    .getByRole("button", { name: "Play your mix", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.audioGains[3].gain.value))
    .toBeCloseTo(0.2 / 6, 3);
  expect(await page.evaluate(() => window.audioSources.length)).toBe(2);
});

test("network and decoding errors leave other channels playing and allow retry", async ({
  page,
}) => {
  let attempt = 0;
  await page.route("**/audio/rain.mp3", async (route) => {
    attempt++;
    if (attempt === 1)
      await route.fulfill({ status: 503, body: "Unavailable" });
    else if (attempt === 2)
      await route.fulfill({
        status: 200,
        contentType: "audio/mpeg",
        body: "invalid audio",
      });
    else await route.continue();
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Play Brown Noise", exact: true })
    .click();
  for (let retry = 0; retry < 2; retry++) {
    await page.getByRole("button", { name: "Play Rain", exact: true }).click();
    await expect(page.locator(".player-message")).toContainText(
      "Rain could not load",
    );
    await expect(
      page.getByRole("button", { name: "Play Rain", exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => window.audioContexts[0].state)).toBe(
      "running",
    );
  }
  await page.getByRole("button", { name: "Play Rain", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Remove Rain", exact: true }),
  ).toHaveAttribute("aria-busy", "false", { timeout: 20000 });
  await expect(page.locator(".mixer-channel")).toHaveCount(2);
  expect(attempt).toBe(3);
});

for (const sound of sounds.filter((sound) => sound.audioType === "file")) {
  test(`licensed recording loads and decodes: ${sound.name}`, async ({
    page,
  }) => {
    const failures: string[] = [];
    page.on("pageerror", (error) => failures.push(error.message));
    await page.goto("/");
    await page
      .getByRole("button", { name: `Play ${sound.name}`, exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: `Remove ${sound.name}`, exact: true }),
    ).toHaveAttribute("aria-busy", "false", { timeout: 30000 });
    const audio = await page.evaluate(() => {
      const source = window.audioSources[0];
      return {
        duration: source.buffer!.duration,
        channels: source.buffer!.numberOfChannels,
        looping: source.loop,
      };
    });
    expect(audio.duration).toBeGreaterThan(1);
    expect(audio.looping).toBe(true);
    expect(await page.evaluate(() => window.audioSources.length)).toBe(1);
    await test.info().attach("decoded-recording", {
      body: JSON.stringify({ src: sound.src, ...audio }),
      contentType: "application/json",
    });
    expect(failures).toEqual([]);
  });
}
