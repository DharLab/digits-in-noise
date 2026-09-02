<template>
    <v-container>
        <h2 class="text-center"> Digits in Noise Completed </h2>
        <p v-if="EMBED" class="text-center mt-2 text-medium-emphasis">
            Your results have been recorded. You may now continue.
        </p>
        <div v-else class="d-flex justify-center mt-4">
            <v-btn color="primary" @click="download">Download <v-icon>file_download</v-icon></v-btn>
        </div>
    </v-container>
</template>

<script setup>

import { onMounted } from 'vue';
import { UseStore } from '@/stores/UseStore';
import { EMBED } from '@/config';
import { saveAs } from 'file-saver';
//import { getUnixTime } from "date-fns";

const store = UseStore();

// SRT = average SNR of the last 19 trials (trials 7-25); startIndex = 25 - 19 = 6
const startIndex = 6;

const computeResult = () => {
    let sum = 0;
    let count = 0;
    for (let r = startIndex; r < store.responses.length; r++) {
        sum += store.responses[r].snr;
        count += 1;
    }
    const srt = count > 0 ? sum / count : null;
    return { srt, responses: store.responses };
}

onMounted(() => {
    if (!EMBED) return;
    const { srt, responses } = computeResult();
    // Plain-clone: store.responses is a reactive Proxy and postMessage can't structured-clone it.
    const data = JSON.parse(JSON.stringify({ snr: srt, srt, responses, nTrials: 25, version: 1 }));
    // Host's DinComponent listens for this and re-emits `next("din", { dinScore, dinRawResults })`.
    window.parent.postMessage({ type: "data", payload: { data } }, window.location.origin);
});

const download = () => {
    const { srt, responses } = computeResult();
    const output = { srt, responses };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    saveAs(blob, store.pid + "_DIN.json");
}


</script>
