<template>
    <v-container>
        <h2 class="text-center"> Digits in Noise Completed </h2>
        <p v-if="EMBED" class="text-center mt-2 text-medium-emphasis">
            Your results have been recorded. You may now continue.
        </p>
        <div v-else>
            <div class="d-flex justify-center mt-4" style="gap: 12px;">
                <v-btn color="primary" @click="download">Download <v-icon>file_download</v-icon></v-btn>
                <v-btn variant="outlined" @click="backToStart">Back to Start <v-icon>home</v-icon></v-btn>
            </div>
            <v-card class="mx-auto mt-4" max-width="720" variant="outlined">
                <v-card-title>SRT: {{ srtDisplay }} dB SNR</v-card-title>
                <v-card-text>
                    <v-table density="compact">
                        <thead>
                            <tr>
                                <th>Trial</th>
                                <th>Target</th>
                                <th>Response</th>
                                <th>SNR (dB)</th>
                                <th>Correct</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="(r, i) in store.responses" :key="i">
                                <td>{{ i + 1 }}</td>
                                <td>{{ r.target }}</td>
                                <td>{{ r.response }}</td>
                                <td>{{ r.snr }}</td>
                                <td>{{ r.correct ? 'Yes' : 'No' }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                </v-card-text>
            </v-card>
        </div>
    </v-container>
</template>

<script setup>

import { computed, onMounted } from 'vue';
import { UseStore } from '@/stores/UseStore';
import { EMBED } from '@/config';
import { saveAs } from 'file-saver';
import * as Tone from 'tone';
//import { getUnixTime } from "date-fns";

const store = UseStore();

// SRT = average SNR of the last 19 trials (trials 7-25); startIndex = 25 - 19 = 6
const startIndex = 6;

// Browsers don't expose real hardware specs (CPU/GPU model, RAM, audio interface) for
// privacy reasons; this is what's actually available. audioSampleRate/latency are the
// most relevant fields here since they're the real output characteristics of this device.
const getDeviceInfo = () => {
    const ctx = Tone.getContext().rawContext;
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        cpuCores: navigator.hardwareConcurrency ?? null,
        deviceMemoryGB: navigator.deviceMemory ?? null,
        screen: `${screen.width}x${screen.height}`,
        audioSampleRate: ctx.sampleRate,
        audioBaseLatency: ctx.baseLatency ?? null,
        audioOutputLatency: ctx.outputLatency ?? null,
    };
}

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

const srtDisplay = computed(() => {
    const { srt } = computeResult();
    return srt == null ? '—' : srt.toFixed(2);
});

// 'comfort' = the self-set slider ("Patient Calibration"); 'file' = the SPL-meter
// calibration file ("Researcher Calibration"). Embed always behaves as 'comfort'.
const calibrationType = computed(() => store.calibrationMode === 'comfort' ? 'Patient' : 'Researcher');

// Calibration-specific values behind calibrationType: the chosen comfort level (Patient),
// or the two measured SPL-meter readings (Researcher).
const calibrationDetails = computed(() => calibrationType.value === 'Patient'
    ? { comfortDbfs: store.comfortDbfs }
    : { leftZeroSPL: store.leftZeroSPL, rightZeroSPL: store.rightZeroSPL });

onMounted(() => {
    if (!EMBED) return;
    const { srt, responses } = computeResult();
    // Plain-clone: store.responses is a reactive Proxy and postMessage can't structured-clone it.
    const data = JSON.parse(JSON.stringify({ snr: srt, srt, responses, nTrials: 25, version: 1, audioMode: store.audioMode, calibrationType: calibrationType.value, ...calibrationDetails.value, device: getDeviceInfo() }));
    // Host's DinComponent listens for this and re-emits `next("din", { dinScore, dinRawResults })`.
    window.parent.postMessage({ type: "data", payload: { data } }, window.location.origin);
});

const pad = (n) => String(n).padStart(2, '0');

const download = () => {
    const { srt, responses } = computeResult();
    const now = new Date();
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const output = { pid: store.pid, date, time, srt, responses, audioMode: store.audioMode, calibrationType: calibrationType.value, ...calibrationDetails.value, device: getDeviceInfo() };
    const blob = new Blob([JSON.stringify(output, null, 2)], { type: "application/json" });
    saveAs(blob, store.pid + "_DIN.json");
}

// Full reload: the router's one-way guard blocks leaving /end via normal navigation, and a
// reload clears the whole store for the next participant. Goes straight to the participant-ID
// page, skipping the splash screen.
const backToStart = () => {
    window.onbeforeunload = null;
    window.location.href = import.meta.env.BASE_URL + 'preloader';
}

</script>
