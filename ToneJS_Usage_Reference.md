# Tone.js Usage Reference — Digits-in-Noise Project

This document describes exactly how the Digits-in-Noise (DIN) hearing test app uses Tone.js. It is written as context for a new project investigating how Tone.js volume values relate to real-world dB SPL readings.

---

## 1. What the app does (audio summary)

The app plays digit triplets (speech recordings) in one ear while playing speech-shaped noise in the other ear. The ratio between digit volume and noise volume is the SNR being tested. The adaptive algorithm adjusts noise volume trial-by-trial to find the SNR at which the participant gets 50% correct — the Speech Reception Threshold (SRT).

- **Left channel** = digit speech (target signal)
- **Right channel** = speech-shaped noise (masker)

---

## 2. Audio files

Loaded from `/public/sounds/`:

| Key in ToneAudioBuffers | File | Purpose |
|---|---|---|
| `ss_noise` | `English_speech_shaped.wav` | Looping background noise |
| `cal_tone` | `cal_tone.wav` | Calibration reference tone |
| `n0_1` through `n9_3` | `newSR_0_1_rs.wav` ... `newSR_9_3_rs.wav` | 10 digits × 3 recorded versions |

The app uses version `_2` of each digit (flat intonation) for the actual task.

---

## 3. Audio loading — ToneAudioBuffers (PreloaderView.vue)

All audio is preloaded into a `Tone.ToneAudioBuffers` map at app startup:

```js
store.soundLibrary = new Tone.ToneAudioBuffers({
    ss_noise: "sounds/English_speech_shaped.wav",
    cal_tone: "sounds/cal_tone.wav",
    n0_1: "sounds/newSR_0_1_rs.wav",
    // ... all 32 files
}, () => {
    // callback fires when all buffers are loaded
    const noisePanner = new Tone.Panner({ pan: 1 }).toDestination(); // right channel
    store.noisePlayer = new Tone.Player().connect(noisePanner);
    store.noisePlayer.buffer = store.soundLibrary.get("ss_noise");
});
```

The noise player is created once and stored in Pinia state (`store.noisePlayer`). It is reused across all trials.

---

## 4. Audio graph / signal chain

### Noise (right channel, persistent)
```
store.noisePlayer (Tone.Player)
    → Tone.Panner({ pan: 1 })   ← hard-panned right
    → Tone.Destination
```

### Digits (left channel, created per trial)
```
Tone.Player (created fresh each trial)
    → Tone.Panner({ pan: -1 })  ← hard-panned left
    → Tone.Destination
```

### Calibration tone (CalibrationComp.vue, one-time setup)
```
Tone.Player (toneLeft)  → Tone.Panner({ pan: -1 }) → Tone.Destination
Tone.Player (toneRight) → Tone.Panner({ pan:  1 }) → Tone.Destination
```

---

## 5. Volume system — dBFS, not dB SPL

**Critical distinction:** `player.volume.value` in Tone.js is in **dBFS** (decibels relative to Full Scale), not dB SPL. Tone.js has no awareness of the real world — the same dBFS value will produce different SPL depending on OS volume, audio interface, amplifier, headphones, and room.

The app uses a **calibration offset** system to bridge dBFS → dB SPL:

- `store.leftOffset` — the dBFS adjustment needed so the left channel outputs exactly 65 dB SPL on a sound level meter
- `store.rightOffset` — same for the right channel

Example:
- If the system outputs 72 dB SPL at 0 dBFS on the left channel → `leftOffset = -7`
- If the system outputs 68 dB SPL at 0 dBFS on the right channel → `rightOffset = -3`

These are stored in a `calibration.json` file and loaded into the store at the start of each session.

### Listening level offset

`store.listenLevel` is an additional global offset:
- `0` = 65 dB SPL baseline (default)
- `5` = 70 dB SPL baseline

It shifts both digit and noise volumes equally, so SNR is preserved.

---

## 6. Volume formulas (from PlayDigits.js)

For each trial, volumes are calculated as:

```js
// Digit volume (left channel) — constant across all trials
let targetDigitsVolume = 0 + store.leftOffset + store.listenLevel;
// e.g. 0 + (-7) + 0 = -7 dBFS → outputs 65 dB SPL

// Noise volume (right channel) — changes each trial
let targetNoiseVolume = rawSNR + store.rightOffset + store.listenLevel;
// e.g. 0 + (-3) + 0 = -3 dBFS → outputs 65 dB SPL at SNR=0

// SNR stored for results (sign-flipped because rawSNR is noise-referenced)
store.currentSNR = -rawSNR;
```

`rawSNR` starts at `0` and steps by ±2 dB each trial:
- Correct response → `rawSNR += 2` (noise gets louder → harder)
- Incorrect response → `rawSNR -= 2` (noise gets quieter → easier)
- Clamped to `[-16, +24]`

The digit volume **never changes** between trials. Only noise volume changes.

---

## 7. Per-trial playback sequence (PlayDigits.js `play()`)

```js
async function play(targetNoiseVolume) {
    // 1. Compute volumes
    store.currentSNR = -targetNoiseVolume;
    targetNoiseVolume = targetNoiseVolume + store.rightOffset + store.listenLevel;
    let targetDigitsVolume = 0 + store.leftOffset + store.listenLevel;

    // 2. Fade noise in (500ms ramp from -Infinity to target)
    toRaw(store.noisePlayer).volume.value = -Infinity;
    toRaw(store.noisePlayer).start();
    toRaw(store.noisePlayer).volume.rampTo(targetNoiseVolume, 0.5);
    await wait(1000); // wait 1s for noise to establish

    // 3. Create digit player + sequencer
    const panner = new Tone.Panner({ pan: -1 }).toDestination();
    const player = new Tone.Player().connect(panner);
    player.volume.value = targetDigitsVolume;

    // Sequence plays 3 digits at "1.0796" bar intervals
    // 1.0796 bars @ 120 BPM = ~904.6ms + 175ms gap between digits
    const seq = new Tone.Sequence((time, index) => {
        player.buffer = store.soundLibrary.get(index);
        player.start(time);
    }, [target1, target2, target3], "1.0796").start();
    seq.loop = false;
    Tone.getTransport().start();

    await wait(3700); // wait for all 3 digits to finish

    // 4. Fade noise out
    toRaw(store.noisePlayer).volume.rampTo(-Infinity, 0.5);
    await wait(500);
    toRaw(store.noisePlayer).stop();
}
```

Timing constants derived from digit duration (~904.6ms):
- `"1.0796"` bars at 120 BPM ≈ 904.6ms + 175ms spacing between digits
- `3700ms` total wait covers all 3 digits playing plus fade
- `500ms` fade-out duration

---

## 8. Calibration tone playback (CalibrationComp.vue)

During calibration, the clinician plays a reference tone and tweaks the offset number until a sound level meter reads exactly 65 dB SPL. This is done separately for left and right channels.

```js
// Volume is set directly to the offset value being tuned
toneLeft.volume.value = leftOffset.value;   // e.g. -7
toneLeft.start();

toneRight.volume.value = rightOffset.value; // e.g. -3
toneRight.start();
```

The result is saved to `calibration.json` and reloaded at the next session.

---

## 9. Known issues / things to investigate

1. **Calibration tone bug in PlayDigits.js**: `playCalibrationTone()` sets `targetCalibrationVolume = 65` (hardcoded, wrong). Should be `0 + store.leftOffset + store.listenLevel` to match the formula used in `play()`. The correct implementation is in `CalibrationComp.vue` where `toneLeft.volume.value = leftOffset.value`.

2. **Digit player created fresh each trial**: A new `Tone.Player` and `Tone.Panner` are created on every call to `play()`. These are never explicitly disposed. This may accumulate AudioContext nodes over 25 trials.

3. **Module-level shared refs**: `isPlaying` and `digitsArray` are declared at module scope in `PlayDigits.js` (outside the factory function), so all call sites share the same state. This is fine as long as only one instance is active at a time.

4. **`toRaw()` on noisePlayer**: The noise player is stored in a Pinia ref, which wraps it in a Vue reactive proxy. `toRaw()` is needed to call Tone.js methods on it directly. This is a known gotcha with Tone.js objects inside reactive state.

---

## 10. Key Tone.js APIs used

| API | Purpose |
|---|---|
| `Tone.ToneAudioBuffers` | Batch-load audio files into a keyed map |
| `Tone.Player` | Play a single audio buffer |
| `Tone.Panner` | Hard-pan audio to left (-1) or right (1) channel |
| `Tone.Sequence` | Play events at regular musical intervals |
| `Tone.getTransport().start()` | Start the transport clock for Sequence |
| `player.volume.value` | Set volume in dBFS |
| `player.volume.rampTo(val, time)` | Smooth volume ramp over `time` seconds |
| `store.soundLibrary.get(key)` | Retrieve a loaded `ToneAudioBuffer` by key |

---

## 11. Open questions this app raises

- At a given OS volume and hardware setup, what is the relationship between `player.volume.value` (dBFS) and measured dB SPL?
- Is the relationship linear (1 dBFS = 1 dB SPL change)? It should be, since dB is dB — but does Tone.js introduce any non-linearity?
- Does `rampTo()` ramp linearly in dB or in amplitude? (Tone.js ramps in dB by default for volume params.)
- How accurately does the calibration offset system hold across different OS volume levels?
