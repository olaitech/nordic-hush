import { test, expect } from "@playwright/test";

test("circular timer follows presets, remaining time, fade, cancellation and infinity", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("/");
  const timer = page.locator(".circular-timer");
  const arc = timer.locator(".timer-progress");
  await expect(timer).toContainText("∞");
  await expect(timer).toContainText("No timer");
  await expect(arc).toHaveAttribute("stroke-dashoffset", "1");
  for (const [name, time] of [
    ["15 min", "15:00"],
    ["30 min", "30:00"],
    ["60 min", "1:00"],
    ["2 hours", "2:00"],
  ]) {
    const preset = page.getByRole("button", {
      name: `Set sleep timer to ${name}`,
      exact: true,
    });
    await preset.click();
    await expect(preset).toHaveAttribute("aria-pressed", "true");
    await expect(timer.locator(".timer-digits")).toHaveText(time);
    await expect(timer).not.toHaveClass(/is-running/);
  }
  await page
    .getByRole("button", { name: "Set sleep timer to 15 min", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Play Brown Noise", exact: true })
    .click();
  await expect(timer).toHaveClass(/is-running/);
  await page.clock.fastForward(450000);
  await expect(timer.locator(".timer-digits")).toHaveText(/7:([12345]\d|00)/);
  const offset = Number(await arc.getAttribute("stroke-dashoffset"));
  expect(offset).toBeGreaterThanOrEqual(0.5);
  expect(offset).toBeLessThan(0.53);
  await page.clock.fastForward(425000);
  await expect(timer).toContainText("Soft fade");
  await expect(timer.getByRole("timer")).toHaveAttribute("aria-live", "off");
  await page.getByRole("button", { name: "Cancel timer", exact: true }).click();
  await expect(timer).toContainText("∞");
  await expect(timer).not.toHaveClass(/is-running/);
  await page
    .getByRole("button", { name: "Set sleep timer to 30 min", exact: true })
    .click();
  await expect(timer).toHaveClass(/is-running/);
  await page.getByRole("button", { name: "No timer", exact: true }).click();
  await expect(timer).toContainText("No timer");
  await expect(
    page.getByRole("button", { name: "Cancel timer", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Pause all sounds" }),
  ).toBeEnabled();
});

for (const width of [360, 390, 430]) {
  test(`circular timer is compact and keyboard accessible at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("/sounds/rain-sounds-for-sleeping");
    await page.locator("#sleep-timer").scrollIntoViewIfNeeded();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    const circle = await page.locator(".circular-timer").boundingBox();
    expect(circle!.width).toBe(160);
    const preset = page.getByRole("button", {
      name: "Set sleep timer to 15 min",
      exact: true,
    });
    await preset.focus();
    await page.keyboard.press("Enter");
    await expect(preset).toHaveAttribute("aria-pressed", "true");
    const box = await preset.boundingBox();
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
    await page
      .locator("#sleep-timer")
      .screenshot({ path: `artifacts/timer-${width}.png` });
  });
}
