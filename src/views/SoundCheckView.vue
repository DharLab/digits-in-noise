<template>
  <v-container style="max-width: 720px;">
    <h2 class="mb-2">Sound Check</h2>
    <p class="text-medium-emphasis mb-6">Play each sound the test uses. Each digit plays the same take (_2) as the task.</p>

    <div class="d-flex flex-wrap" style="gap: 12px;">
      <v-btn v-for="d in digits" :key="d" :disabled="!ready" color="primary" size="large" @click="playOne(`n${d}_2`)">
        Digit {{ d }}
      </v-btn>
    </div>

    <v-divider class="my-6"></v-divider>

    <v-btn :disabled="!ready" variant="outlined" @click="playOne('ss_noise')">Play Noise</v-btn>
    <p class="mt-4 text-medium-emphasis">Status: {{ status }}</p>
  </v-container>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as Tone from 'tone';

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ready = ref(false);
const status = ref('Loading...');

const B = import.meta.env.BASE_URL;
const files = { ss_noise: B + 'sounds/English_speech_shaped.wav' };
digits.forEach((d) => { files[`n${d}_2`] = B + `sounds/newSR_${d}_2_rs.wav`; });

let buffers = null;
let player = null;

onMounted(() => {
  buffers = new Tone.ToneAudioBuffers(files, () => {
    ready.value = true;
    status.value = 'Ready. Click a sound to play it.';
  });
});

async function playOne(key) {
  await Tone.start();
  if (player) { player.stop(); player.dispose(); }
  player = new Tone.Player(buffers.get(key)).toDestination();
  player.start();
  status.value = `Playing ${key} (${buffers.get(key).duration.toFixed(3)}s)`;
}

onBeforeUnmount(() => {
  if (player) { player.stop(); player.dispose(); }
  if (buffers) buffers.dispose();
});
</script>
