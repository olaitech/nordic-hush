import { test, expect } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { serverModule } from "./helpers/server-module";
import type { Story } from "../src/types/story";

const { stories, findStory, storyPaths } = serverModule<
  typeof import("../src/data/stories")
>("src/data/stories.ts");
const { storyLibraryMetadata, storyMetadata, storyStructuredData } =
  serverModule<typeof import("../src/lib/stories")>("src/lib/stories.ts");
const { readStoryTranscript } = serverModule<
  typeof import("../src/lib/story-transcript")
>("src/lib/story-transcript.ts");
const { Header, Footer } = serverModule<
  typeof import("../src/components/Shell")
>("src/components/Shell.tsx");
const { StoryLibrary } = serverModule<
  typeof import("../src/components/stories/StoryLibrary")
>("src/components/stories/StoryLibrary.tsx");
const { StorySource } = serverModule<
  typeof import("../src/components/stories/StorySource")
>("src/components/stories/StorySource.tsx");
const { StoryTranscript } = serverModule<
  typeof import("../src/components/stories/StoryTranscript")
>("src/components/stories/StoryTranscript.tsx");
const { AudioProvider } = serverModule<
  typeof import("../src/context/AudioProvider")
>("src/context/AudioProvider.tsx");
const {
  default: StoryPage,
  generateMetadata,
  generateStaticParams,
} = serverModule<typeof import("../src/app/stories/[slug]/page")>(
  "src/app/stories/[slug]/page.tsx",
);
const { default: sitemap } =
  serverModule<typeof import("../src/app/sitemap")>("src/app/sitemap.ts");

// Test-process-only catalog fixture. Never written to production data or assets.
const fixture: Story = {
  id: "test-story",
  slug: "test-story",
  title: "Test story",
  type: "original",
  description: "Test description",
  shortDescription: "Test summary",
  seoTitle: "Test story | Nordic Hush",
  seoDescription: "Test SEO description",
};

const publishedStories = [...stories];

test("published story, transcript, audio and discovery work without JavaScript", async ({
  browser,
  request,
}) => {
  expect(stories.map((story) => story.slug)).toEqual(["the-long-winter"]);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto("/stories");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sleep Stories",
  );
  await expect(
    page.getByRole("heading", { name: "The Long Winter", exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "index, follow",
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://nordic-hush.com/stories",
  );
  await expect(
    page.locator("audio, .narration-controls"),
  ).toHaveCount(0);
  for (const name of ["Main navigation", "Footer navigation"]) {
    await expect(
      page
        .getByRole("navigation", { name })
        .getByRole("link", { name: "Stories", exact: true }),
    ).toHaveCount(1);
  }
  const xml = await (await request.get("/sitemap.xml")).text();
  expect(xml).toContain("<loc>https://nordic-hush.com/stories</loc>");
  expect(xml).toContain("<loc>https://nordic-hush.com/stories/the-long-winter</loc>");
  const detail = await page.goto("/stories/the-long-winter");
  expect(detail?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Long Winter");
  await expect(page).toHaveTitle(stories[0].seoTitle);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://nordic-hush.com/stories/the-long-winter");
  await expect(page.getByRole("button", { name: "Listen to The Long Winter" })).toBeVisible();
  const transcript = await readStoryTranscript(stories[0].transcriptPath);
  expect(transcript).not.toBeNull();
  expect(transcript!.match(/^# Chapter /gm)).toHaveLength(4);
  await page.getByText("Read transcript", { exact: true }).click();
  await expect(page.locator(".story-transcript")).toContainText("Chapter Four — When the Light Returned");
  await expect(page.locator(".story-transcript")).toContainText("And the soft, peaceful beginning of spring.");
  const audio = await request.get(stories[0].audioSrc!, { headers: { Range: "bytes=0-1023" } });
  expect(audio.status()).toBe(206);
  expect(audio.headers()["content-type"]).toContain("audio/mpeg");
  expect((await audio.body()).length).toBe(1024);
  expect((await request.get("/stories/not-a-real-story")).status()).toBe(404);
  await context.close();
});

test("a fixture activates navigation, sitemap, detail rendering and metadata from the catalog", async () => {
  stories.splice(0, stories.length, fixture);
  try {
    expect(storyLibraryMetadata().robots).toEqual({
      index: true,
      follow: true,
    });
    expect(storyPaths()).toEqual(["/stories", "/stories/test-story"]);
    expect(sitemap().map((entry) => entry.url)).toContain(
      "https://nordic-hush.com/stories/test-story",
    );
    expect(sitemap().map((entry) => entry.url)).toContain(
      "https://nordic-hush.com/stories",
    );
    expect(generateStaticParams()).toEqual([{ slug: fixture.slug }]);
    expect(findStory(fixture.slug)).toBe(fixture);
    for (const Component of [Header, Footer]) {
      expect(renderToStaticMarkup(createElement(Component))).toContain(
        'href="/stories"',
      );
    }
    const library = renderToStaticMarkup(
      createElement(StoryLibrary, { stories }),
    );
    expect(library).toContain("Original Nordic Hush Stories");
    expect(library).not.toContain("Bedtime Classics");
    const props = { params: Promise.resolve({ slug: fixture.slug }) };
    expect(await generateMetadata(props)).toEqual(storyMetadata(fixture));
    expect(storyMetadata(fixture).alternates?.canonical).toBe(
      "/stories/test-story",
    );
    const page = await StoryPage(props);
    const html = renderToStaticMarkup(createElement(AudioProvider, null, page));
    expect(html).toContain("<h1>Test story</h1>");
    expect(html).toContain("About this story");
    expect(html).not.toContain("Read transcript");
    expect(html).not.toContain("AudioObject");
    expect(html).not.toContain("Story player");
    expect(
      storyStructuredData({
        ...fixture,
        audioSrc: "/stories/test-story/narration.mp3",
      })["@graph"],
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ "@type": "AudioObject" }),
      ]),
    );
  } finally {
    stories.splice(0, stories.length, ...publishedStories);
  }
  expect(storyLibraryMetadata([]).robots.index).toBe(false);
  expect(storyPaths([])).toEqual([]);
  expect(renderToStaticMarkup(createElement(StoryLibrary, { stories: [] }))).toContain("A quieter library is being prepared.");
});

test("sources require an explicit public-domain declaration; transcripts are escaped server HTML", async () => {
  for (const publicDomain of [false, undefined]) {
    expect(
      renderToStaticMarkup(
        createElement(StorySource, {
          story: {
            ...fixture,
            type: "classic",
            source: { label: "Test source", publicDomain },
          },
        }),
      ),
    ).not.toContain("Public domain");
  }
  expect(
    renderToStaticMarkup(
      createElement(StorySource, {
        story: { ...fixture, source: { publicDomain: true } },
      }),
    ),
  ).toContain("Public domain");
  expect(
    renderToStaticMarkup(createElement(StoryTranscript, { text: null })),
  ).toBe("");
  const html = renderToStaticMarkup(
    createElement(StoryTranscript, {
      text: "Test transcript\n\n<script>alert(1)</script>",
    }),
  );
  expect(html).toContain("<summary>Read transcript</summary>");
  expect(html).toContain("Test transcript");
  expect(html).not.toContain("<script>");
  expect(await readStoryTranscript()).toBeNull();
  expect(await readStoryTranscript("not-present/transcript.md")).toBeNull();
  await expect(readStoryTranscript("../../../README.md")).rejects.toThrow(
    "inside src/content/stories",
  );
});

for (const width of [360, 390, 430]) {
  test(`future story controls fit ${width}px using a test-only render state`, async ({
    page,
  }) => {
    const audioModule = serverModule<
      typeof import("../src/context/AudioProvider")
    >("src/context/AudioProvider.tsx");
    const { BottomPlayer } = serverModule<
      typeof import("../src/components/BottomPlayer")
    >("src/components/BottomPlayer.tsx");
    const originalHook = audioModule.useAudio;
    const noop = () => {};
    audioModule.useAudio = () => ({
      mix: { rain: 0.18 },
      playing: true,
      master: 0.4,
      deadline: null,
      timer: 0,
      error: "",
      busy: false,
      loading: {},
      toggle: noop,
      playPause: noop,
      setChannel: noop,
      setMaster: noop,
      setTimer: noop,
      remove: noop,
      narration: {
        track: {
          id: fixture.id,
          slug: fixture.slug,
          title: fixture.title,
          audioSrc: "/audio/rain.mp3",
        },
        playing: false,
        loading: false,
        currentTime: 42,
        duration: 120,
        volume: 0.8,
        error: "",
      },
      playNarration: noop,
      pauseNarration: noop,
      stopNarration: noop,
      seekNarration: noop,
      setNarrationVolume: noop,
    });
    let markup: string;
    stories.push(fixture);
    try {
      markup = renderToStaticMarkup(
        createElement(
          "div",
          null,
          createElement(
            "div",
            { className: "site-shell" },
            createElement(Header),
            createElement(StoryLibrary, { stories }),
          ),
          createElement(BottomPlayer),
        ),
      );
    } finally {
      audioModule.useAudio = originalHook;
      stories.splice(0, stories.length, ...publishedStories);
    }
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/stories");
    const styles = await page
      .locator('link[rel="stylesheet"]')
      .evaluateAll((links) => links.map((link) => link.outerHTML).join(""));
    await page.setContent(
      `<html><head>${styles}</head><body>${markup}</body></html>`,
    );
    await expect(page.getByText("NOW LISTENING")).toBeVisible();
    await expect(
      page.getByRole("slider", { name: "Story progress" }),
    ).toHaveValue("42");
    await expect(
      page.getByRole("button", { name: "Pause ambient sounds" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    const player = await page
      .getByRole("complementary", { name: "Audio player" })
      .boundingBox();
    for (const name of ["Resume story", "Stop story"]) {
      const button = await page.getByRole("button", { name }).boundingBox();
      expect(button!.height).toBeGreaterThanOrEqual(44);
      expect(button!.y).toBeGreaterThanOrEqual(player!.y);
      expect(button!.y + button!.height).toBeLessThanOrEqual(844);
    }
    await page.screenshot({
      path: `artifacts/story-controls-${width}.png`,
      fullPage: true,
    });
  });

  test(`story library fits ${width}px without media requests or browser errors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    const media: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => {
      if (/\.(mp3|wav)(\?|$)/.test(request.url())) media.push(request.url());
    });
    await page.goto("/stories");
    await expect(
      page.getByRole("heading", { name: "Sleep Stories" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: `artifacts/stories-${width}.png`,
      fullPage: true,
    });
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Sounds", exact: true })
      .click();
    await expect(page).toHaveURL("/sounds");
    expect(media).toEqual([]);
    expect(errors).toEqual([]);
  });
}
