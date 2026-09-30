import { test, expect } from "@playwright/test";
import { sounds } from "../src/data/sounds";
import { site } from "../src/config/site";
import { storyPaths } from "../src/data/stories";

test("sitemap, robots, canonical responses and direct permanent redirects", async ({
  request,
}) => {
  const response = await request.get("/sitemap.xml");
  expect(response.status()).toBe(200);
  const xml = await response.text();
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
  const paths = [
    "/",
    "/sounds",
    "/about",
    "/privacy",
    ...sounds.map((sound) => `/sounds/${sound.slug}`),
    ...storyPaths(),
  ];
  expect(urls.sort()).toEqual(paths.map((path) => `${site.url}${path}`).sort());
  expect(xml).not.toContain("lastmod");
  for (const path of paths)
    expect((await request.get(path, { maxRedirects: 0 })).status()).toBe(200);
  for (const sound of sounds) {
    for (const old of sound.legacySlugs) {
      const redirect = await request.get(`/sounds/${old}`, { maxRedirects: 0 });
      expect(redirect.status()).toBe(308);
      expect(new URL(redirect.headers().location, site.url).pathname).toBe(
        `/sounds/${sound.slug}`,
      );
    }
  }
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain(`Sitemap: ${site.url}/sitemap.xml`);
  expect(await robots.text()).toContain("Allow: /");
  expect((await request.get("/sounds/does-not-exist")).status()).toBe(404);
});

test("all landing pages expose unique metadata and useful content without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const titles = new Set<string>();
  const descriptions = new Set<string>();
  for (const sound of sounds) {
    await page.goto(`/sounds/${sound.slug}`);
    const title = `${sound.seoTitle} | ${site.name}`;
    await expect(page).toHaveTitle(title);
    titles.add(title);
    descriptions.add(sound.seoDescription);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      sound.seoDescription,
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${site.url}/sounds/${sound.slug}`,
    );
    for (const [property, content] of [
      ["og:title", title],
      ["og:description", sound.seoDescription],
      ["og:url", `${site.url}/sounds/${sound.slug}`],
      ["og:site_name", site.name],
      ["og:type", "website"],
    ]) {
      await expect(
        page.locator(`meta[property="${property}"]`),
      ).toHaveAttribute("content", content);
    }
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
    await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
      "content",
      title,
    );
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText(sound.h1);
    await expect(page.locator(".detail-intro p")).toHaveText(sound.intro);
    await expect(page.locator(".sound-about")).toContainText(
      sound.longDescription.split("\n\n")[0],
    );
    await expect(page.locator(".faq details")).toHaveCount(sound.faq.length);
    await expect(
      page.getByRole("navigation", { name: "Breadcrumb", exact: true }),
    ).toContainText(sound.h1);
    for (const id of sound.relatedSoundIds) {
      const related = sounds.find((item) => item.id === id)!;
      await expect(
        page
          .locator(".related-links")
          .getByRole("link", { name: related.h1, exact: true }),
      ).toHaveAttribute("href", `/sounds/${related.slug}`);
    }
    const schema = JSON.parse(
      (await page.locator('script[type="application/ld+json"]').textContent())!,
    );
    expect(schema["@type"]).toBe("BreadcrumbList");
    expect(
      schema.itemListElement.map((item: { item: string }) => item.item),
    ).toEqual([
      `${site.url}/`,
      `${site.url}/sounds`,
      `${site.url}/sounds/${sound.slug}`,
    ]);
  }
  expect(titles.size).toBe(12);
  expect(descriptions.size).toBe(12);
  for (const path of ["/", "/sounds"]) {
    await page.goto(path);
    for (const sound of sounds)
      await expect(
        page.getByRole("link", { name: `About ${sound.name}`, exact: true }),
      ).toHaveAttribute("href", `/sounds/${sound.slug}`);
  }
  await page.goto("/");
  await expect(page).toHaveTitle(site.title);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    site.description,
  );
  const schema = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent())!,
  );
  expect(schema).toMatchObject({
    "@type": "WebSite",
    name: site.name,
    url: `${site.url}/`,
  });
  await context.close();
});

for (const width of [360, 390, 430]) {
  test(`sound pages fit ${width}px and keep play above the bottom player`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const audioRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/audio/")) audioRequests.push(request.url());
    });
    for (const sound of sounds) {
      await page.goto(`/sounds/${sound.slug}`);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);
      const button = await page
        .getByRole("button", { name: `Play ${sound.name}`, exact: true })
        .boundingBox();
      const player = await page
        .getByRole("complementary", { name: "Audio player" })
        .boundingBox();
      expect(button!.y + button!.height).toBeLessThan(player!.y);
    }
    expect(audioRequests).toEqual([]);
    await page.goto("/sounds/rain-sounds-for-sleeping");
    await page.screenshot({
      path: `artifacts/sound-${width}.png`,
      fullPage: true,
    });
  });
}
