# Host integration (auditory-wellness)

How to swap the CloudFront HearDigits widget for this tool. All host-side work
happens in the **host repo** (branch `auditory-wellness`); this folder is just
reference.

## Contract

The new `DinComponent.vue` must do exactly what the old one did:

```js
emits("next", "din", { dinScore: <SNR number>, dinRawResults: <object> })
```

`dinScore` is the SRT (a dB SNR, typically negative). `dinRawResults` is stored
by the host as an opaque JSON blob — its shape is up to us. This build sends:

```jsonc
{
  "snr":  -7.3,          // == dinScore, read by DinComponent as payload.data.snr
  "srt":  -7.3,
  "responses": [ { "response": "483", "target": "483", "snr": 0, "correct": true }, ... ], // 25 entries
  "nTrials": 25,
  "version": 1
}
```

## Steps

1. **Build the embed bundle** (in digits-in-noise):
   ```sh
   npm run build:embed
   ```
   Produces `dist/` with `base: '/din/'` — `index.html`, `assets/`, `sounds/`.

2. **Vendor it into the host** — copy `dist/` to `<host>/public/din/` so it
   serves at `<host-origin>/din/index.html`. (For a Vite host, `public/din/` is
   copied verbatim into the host build.)

3. **Replace `src/components/DinComponent.vue`** in the host with
   [`DinComponent.vue`](./DinComponent.vue) from this folder.

4. **Remove the old widget code**: the `loadScript(".../widget_frame_init.js")`
   call and `window.initializeHearDigits(...)`. Drop the `vue-plugin-load-script`
   dependency if nothing else imports it.

5. **Nothing else changes.** `TestsView.vue` still does
   `scores.dinScore = data.dinScore` / `scores.dinRawResults = structuredClone(...)`
   and submits them the same way. Demographics stay in `DemographicsView.vue`.

## Flow the embed runs

`begin → disclaimer + headphones → comfortable-level slider → instructions → 25-trial task → postMessage`

No participant ID, no SPL-meter calibration, no demographic questions — matches
the HearDigits widget it replaces.

## Re-vendoring after a DIN change

Repeat steps 1–2. Consider a script in the host `package.json`, e.g.
`"sync:din": "rm -rf public/din && cp -r ../digits-in-noise/dist public/din"`.
