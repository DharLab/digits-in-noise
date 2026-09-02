import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { EMBED } from '@/config'

export const UseStore = defineStore('store', () => {
  const pid =ref(null);
  const soundLibrary = ref(null);
  const noisePlayer = ref(null);
  const leftOffset = ref(null);
  const rightOffset = ref(null);
  const leftZeroSPL = ref(null);
  const rightZeroSPL = ref(null);
  const listenLevel = ref(65);
  const comfortDbfs = ref(null); // embed only: participant-set digit level in dBFS
  const responses = ref(null);
  const currentSNR = ref(null);


  const calibrationValid = computed(() => {
    if (soundLibrary.value == null || noisePlayer.value == null) {
      return false;
    }
    if (EMBED) {
      // Embed replaces SPL-meter calibration with a participant "comfortable level" step.
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

  return { pid, soundLibrary, noisePlayer, leftOffset, rightOffset, leftZeroSPL, rightZeroSPL, listenLevel, comfortDbfs, calibrationValid, addResponse, responses, currentSNR }
})
