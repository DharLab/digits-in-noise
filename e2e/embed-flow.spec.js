import process from 'node:process';
import { test, expect } from '@playwright/test';

// Walks the full embed flow against a running `npm run dev:embed`.
// Absolute URL because the embed server may not be on the config's baseURL port.
const BASE = process.env.EMBED_BASE || 'http://localhost:5174';

test.use({
  headless: true,
  launchOptions: {
    args: [
      '--autoplay-policy=no-user-gesture-required',
      '--mute-audio',
    ],
  },
});

test('embed flow: begin -> disclaimer -> level -> instructions -> 25 trials -> postMessage', async ({ page }) => {
  test.setTimeout(300000);

  page.on('console', (m) => console.log(`[page:${m.type()}]`, m.text()));
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));

  await page.goto(`${BASE}/din/`);

  // Top-level page: window.parent === window, so postMessage lands here.
  await page.evaluate(() => {
    window.__msgs = [];
    window.addEventListener('message', (e) => window.__msgs.push(e.data));
  });

  // --- Preloader (embed): Begin ---
  await page.getByRole('button', { name: /begin/i }).click();

  // --- Disclaimer ---
  await expect(page).toHaveURL(/\/disclaimer$/);
  const ready = page.getByRole('button', { name: /ready/i });
  await expect(ready).toBeDisabled();
  await page.getByText(/agree to the disclaimer/i).click();
  await expect(ready).toBeEnabled();
  await ready.click();

  // --- Level slider ---
  await expect(page).toHaveURL(/\/level$/);
  const slider = page.getByRole('slider');
  await slider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: /next/i }).click();

  // --- Instructions ---
  await expect(page).toHaveURL(/\/instructions$/);
  await page.getByRole('button', { name: /start/i }).click();

  // --- Task ---
  await expect(page).toHaveURL(/\/task$/);
  await page.getByRole('button', { name: 'Start', exact: true }).click();

  const btn = (name) => page.getByRole('button', { name, exact: true });

  for (let i = 0; i < 25; i++) {
    // keypad appears after the 3-2-1 countdown on the first trial
    await btn('1').waitFor({ state: 'visible', timeout: 30000 });
    await btn('1').click();
    await btn('2').click();
    await btn('3').click();
    const ok = btn('OK');
    await expect(ok).toBeEnabled({ timeout: 30000 }); // enabled only once playback finishes
    await ok.click();
  }

  // --- End (embed) ---
  await expect(page).toHaveURL(/\/end$/, { timeout: 30000 });
  await expect(page.getByText(/results have been recorded/i)).toBeVisible();

  const dinMsg = await page.evaluate(() =>
    (window.__msgs || []).find((m) => m && m.type === 'data'),
  );
  expect(dinMsg, 'a {type:"data"} message was posted').toBeTruthy();
  expect(typeof dinMsg.payload.data.snr).toBe('number');
  expect(dinMsg.payload.data.nTrials).toBe(25);
  expect(Array.isArray(dinMsg.payload.data.responses)).toBe(true);
  expect(dinMsg.payload.data.responses.length).toBe(25);
  for (const r of dinMsg.payload.data.responses) {
    expect(r).toHaveProperty('snr');
    expect(r).toHaveProperty('correct');
    expect(r).toHaveProperty('response');
    expect(r).toHaveProperty('target');
  }
  console.log('DIN postMessage payload.data =', JSON.stringify({
    snr: dinMsg.payload.data.snr,
    srt: dinMsg.payload.data.srt,
    nTrials: dinMsg.payload.data.nTrials,
    version: dinMsg.payload.data.version,
    responses: dinMsg.payload.data.responses.length + ' entries',
  }));
});
