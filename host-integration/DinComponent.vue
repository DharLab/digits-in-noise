<!--
  DROP-IN REPLACEMENT for the host site's src/components/DinComponent.vue
  (the one that currently loads the CloudFront HearDigits widget).

  This file belongs in the HOST repo (branch: auditory-wellness), not in
  digits-in-noise. It is kept here only as the reference implementation of the
  integration contract.

  Contract (unchanged from the old component):
    emits("next", "din", { dinScore: <SNR number>, dinRawResults: <object> })

  Setup in the host:
    1. Build the embed bundle in digits-in-noise:  npm run build:embed
    2. Copy digits-in-noise/dist/  ->  <host>/public/din/
    3. Replace src/components/DinComponent.vue with this file
    4. Remove the old CloudFront loadScript / window.initializeHearDigits code
       and drop the "vue-plugin-load-script" dependency if nothing else uses it
-->
<template>
  <v-container class="pa-0" fluid>
    <iframe
      ref="frame"
      :src="dinUrl"
      allow="autoplay"
      title="Digits in Noise test"
      style="width: 100%; height: 100vh; border: 0; display: block;"
    ></iframe>
  </v-container>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref } from "vue";

const emits = defineEmits(["next"]);

// Vendored DIN build served from the host's own origin.
const dinUrl = "/din/index.html";

const frame = ref(null);
let handler = null;

onMounted(() => {
  handler = (event) => {
    // Same origin because the build is bundled into the host deploy under /din/.
    if (event.origin !== window.location.origin) return;
    if (event.data && event.data.type === "data") {
      emits("next", "din", {
        dinScore: event.data.payload.data.snr,
        dinRawResults: event.data.payload.data,
      });
    }
  };
  window.addEventListener("message", handler);
});

onBeforeUnmount(() => {
  if (handler) window.removeEventListener("message", handler);
});
</script>
