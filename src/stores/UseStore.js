import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const UseStore = defineStore('store', () => {
  const pid =ref(null);
  const soundLibrary = ref(null);
  const noisePlayer = ref(null);
  const leftOffset = ref(null);
  const rightOffset = ref(null);
  const leftZeroSPL = ref(null);
  const rightZeroSPL = ref(null);
  const listenLevel = ref(65);
  const responses = ref(null);
  const currentSNR = ref(null);
  

  const calibrationValid = computed(() => {
    if (soundLibrary.value == null ||
      noisePlayer.value == null ||
      leftZeroSPL.value == null ||
      rightZeroSPL.value == null ||
      listenLevel.value == null) {
      return false;
    } else {
      return true;
    }
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

  return { pid, soundLibrary, noisePlayer, leftOffset, rightOffset, leftZeroSPL, rightZeroSPL, listenLevel, calibrationValid, addResponse, responses, currentSNR }
})
