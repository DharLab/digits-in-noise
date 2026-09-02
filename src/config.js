// Build-time flag: true when built or served for embedding in the host site
// via `vite --mode embed` / `vite build --mode embed` (which loads .env.embed).
//
// EMBED swaps three things versus the standalone clinician build:
//   - router route set (adds disclaimer / comfortable-level / instructions screens,
//     drops the SPL-meter calibration screens)
//   - volume model in PlayDigits (participant-set comfortDbfs instead of listenLevel - zeroSPL)
//   - result delivery in EndView (postMessage to the host instead of a file download)
//
// The standalone build leaves this false and keeps the SPL-meter calibration flow
// deployed at digits-in-noise.web.app.
export const EMBED = import.meta.env.VITE_EMBED === '1'
