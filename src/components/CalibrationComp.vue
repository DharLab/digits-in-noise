<template>
    <v-card>
        <v-card-title>Calibration</v-card-title>
        <v-card-text>
        <p>Play the tone for each channel at 0 dBFS. Read the sound level meter and enter the measured dB SPL value below.</p>
        <p>During the task, the left channel plays the target and the right channel plays the noise.</p>
        <p>Save the calibration .json file, then click "Load Calibration File" to load the recently saved calibration file.</p>

        <div class="d-flex mt-6">
            <div class="mr-6">
                <v-btn :color="isPlaying ? 'warning' : 'secondary'" class="mb-2" @click="playLeft">
                    <div v-if="!isPlaying">Play Left Channel Tone<v-icon>play_circle_filled</v-icon></div>
                    <div v-else>Stop Left Channel Tone <v-icon>stop_circle</v-icon></div>
                </v-btn>
                <v-number-input density="compact" :reverse="false" controlVariant="split" label="Left Channel SPL Reading (dB)" :disabled="isPlaying"
                    :hideInput="false" :inset="false" variant="solo" v-model="leftZeroSPL"></v-number-input>
            </div>
            <div>
                <v-btn :color="isPlaying ? 'warning' : 'secondary'" class="mb-2" @click="playRight">
                    <div v-if="!isPlaying">Play Right Channel Tone<v-icon>play_circle_filled</v-icon></div>
                    <div v-else>Stop Right Channel Tone <v-icon>stop_circle</v-icon></div>
                </v-btn>
                <v-number-input density="compact" :reverse="false" controlVariant="split" label="Right Channel SPL Reading (dB)" :disabled="isPlaying"
                    :hideInput="false" :inset="false" variant="solo" v-model="rightZeroSPL"></v-number-input>
            </div>
        </div>
        </v-card-text>
        <v-card-actions>
            <v-btn size="large" color="warning" variant="outlined" @click="cancelClicked">Cancel<v-icon>cancel</v-icon></v-btn>
            <v-btn size="large" width="120" color="primary" variant="tonal" @click="saveClicked">Save <v-icon>chevron_right</v-icon></v-btn>
        </v-card-actions>
    </v-card>
</template>


<script setup>

import { ref } from "vue";
import * as Tone from "tone";
import { UseStore } from "@/stores/UseStore";

const store = UseStore();
const leftZeroSPL = ref(0);
const rightZeroSPL = ref(0);

const emit = defineEmits(["saveClicked", "cancelClicked"]);

const saveClicked = () => {
    emit("saveClicked", leftZeroSPL.value, rightZeroSPL.value);
}

const cancelClicked = () => {
    emit("cancelClicked");
}

// Cal tone plays at 0 dBFS — clinician reads whatever SPL the meter shows
const tonePannerLeft = new Tone.Panner({ pan: -1 }).toDestination();
const tonePannerRight = new Tone.Panner({ pan: 1 }).toDestination();
const toneLeft = new Tone.Player().connect(tonePannerLeft)
const toneRight = new Tone.Player().connect(tonePannerRight)
toneLeft.buffer = store.soundLibrary.get("cal_tone")
toneRight.buffer = store.soundLibrary.get("cal_tone")

const isPlaying = ref(false);
const playLeft = () => {
    if (isPlaying.value == false) {
        toneLeft.volume.value = 0;
        toneLeft.start();
        isPlaying.value = true;
    } else {
        toneLeft.stop();
        isPlaying.value = false;
    }
}

const playRight = () => {
    if (isPlaying.value == false) {
        toneRight.volume.value = 0;
        toneRight.start();
        isPlaying.value = true;
    } else {
        toneRight.stop();
        isPlaying.value = false;
    }
}

</script>