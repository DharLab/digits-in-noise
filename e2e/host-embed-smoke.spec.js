import process from 'node:process';
import { test, expect } from '@playwright/test';

// Boots the vendored DIN build from the HOST dev server origin and walks a few
// screens. Requires the auditory-wellness dev server running (default :5173).
const HOST = process.env.HOST_BASE || 'http://localhost:5173';

test.use({
  headless: true,
  launchOptions: { args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio'] },
});

test('vendored /din/ boots and advances inside the host origin', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  // How DinComponent.vue loads it. Embed uses hash history.
  await page.goto(`${HOST}/din/index.html`);

  // Preloader (embed): audio buffers load, then the Begin gate appears.
  await page.getByRole('button', { name: /begin/i }).click();

  await expect(page).toHaveURL(/#\/disclaimer$/);
  await page.getByText(/agree to the disclaimer/i).click();
  await page.getByRole('button', { name: /ready/i }).click();

  await expect(page).toHaveURL(/#\/level$/);
  await page.getByRole('button', { name: /next/i }).click();

  await expect(page).toHaveURL(/#\/instructions$/);
  await page.getByRole('button', { name: /start/i }).click();

  await expect(page).toHaveURL(/#\/task$/);
  await expect(page.getByRole('button', { name: 'Start', exact: true })).toBeVisible();

  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});
