import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { EMBED } from '@/config'

export const UseStore = defineStore('store', () => {
  const pid =ref(null);
  const soundLibrary = ref(null);
  const noisePlayer = ref(null);
  const noisePanner = ref(null); // kept separately so its pan can be changed live per audioMode
  // Second noise player/panner, fixed pan +1 - used only for Researcher Calibration +
  // Bilateral, where left/right need independent volumes a single panner can't express
  // (see PlayDigits.js play()'s dualChannel branch).
  const noisePlayerB = ref(null);
  const noisePannerB = ref(null);
  const leftOffset = ref(null);
  const rightOffset = ref(null);
  const leftZeroSPL = ref(null);
  const rightZeroSPL = ref(null);
  const listenLevel = ref(65);
  const comfortDbfs = ref(null); // participant-set digit level in dBFS (embed, or clinical "use slider instead")
  // Clinical only: which calibration path the clinician picked, 'file' (SPL-meter calibration.json)
  // or 'comfort' (skip the meter, use the comfortDbfs slider). Embed always behaves as 'comfort'.
  const calibrationMode = ref(null);
  const responses = ref(null);
  const currentSNR = ref(null);
  // 'unilateral' (default, original behavior): digit hard-left, noise hard-right.
  // 'bilateral': digit and noise both centered, identical in both ears.
  const audioMode = ref('unilateral');

  // True when playback should use the single comfortDbfs level instead of the
  // leftZeroSPL/rightZeroSPL/listenLevel SPL-meter calibration.
  const usesComfortLevel = computed(() => EMBED || calibrationMode.value === 'comfort');

  const calibrationValid = computed(() => {
    if (soundLibrary.value == null || noisePlayer.value == null) {
      return false;
    }
    if (usesComfortLevel.value) {
      return comfortDbfs.value != null;
    }
    return leftZeroSPL.value != null &&
      rightZeroSPL.value != null &&
      listenLevel.value != null;
  })

  async function addResponse(response) {

    const prm = new Promise((resolve) => {
      if (responses.value == null) {
        responses.value = [];
      }
      responses.value.push(response);
      console.log("added", responses.value)
      resolve(1);
    })
    return prm
  }

  return { pid, soundLibrary, noisePlayer, noisePanner, noisePlayerB, noisePannerB, leftOffset, rightOffset, leftZeroSPL, rightZeroSPL, listenLevel, comfortDbfs, calibrationMode, usesComfortLevel, calibrationValid, addResponse, responses, currentSNR, audioMode }
})
