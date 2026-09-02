<template>
    <v-container>
        <div class="d-flex flex-column align-center" v-if="state == 'loading'">
            Loading... Please wait
        </div>

        <!-- Embed: no participant ID. Just a start gate so Tone.start() has a user gesture. -->
        <div v-else-if="EMBED" class="text-center">
            <p class="mb-4">Put on your headphones and find a quiet place. When you're ready, begin.</p>
            <v-btn color="primary" size="large" @click="beginEmbed">
                Begin <v-icon>chevron_right</v-icon>
            </v-btn>
        </div>

        <v-form v-else @submit.prevent="submit" v-model="formValid">
            <p>Participant ID:</p>
            <v-text-field v-model="pid" class="flex-grow-12" placeholder="Enter participant ID here" density="compact" :rules="[pidrule]"></v-text-field>
            <v-btn class="mt-2" type="submit" :disabled="!formValid" color="primary">Next <v-icon>chevron_right</v-icon></v-btn>
            <p class="text-subtitle-2 text-medium-emphasis mt-2">Last updated 11 Dec 2025</p>
        </v-form>
    </v-container>
</template>


<script setup>
import * as Tone from "tone";
import { UseStore } from "@/stores/UseStore";
import { EMBED } from "@/config";
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";


const store = UseStore();
const router = useRouter();
const state = ref("loading"); //loading, ready
onMounted(() => {
    state.value = "loading";
    load();
})


const load = () => {
    const B = import.meta.env.BASE_URL;
    const files = {
        ss_noise: B + "sounds/English_speech_shaped.wav",
    };
    // cal_tone (50s / ~4.4MB) is only used by the clinician calibration tools.
    if (!EMBED) {
        files.cal_tone = B + "sounds/cal_tone.wav";
    }
    for (let d = 0; d <= 9; d++) {
        // Only the flat-intonation take (_2) is played in the task; the standalone
        // build still loads all three so its tools can use them.
        const versions = EMBED ? [2] : [1, 2, 3];
        for (const v of versions) {
            files["n" + d + "_" + v] = B + "sounds/newSR_" + d + "_" + v + "_rs.wav";
        }
    }

    store.soundLibrary = new Tone.ToneAudioBuffers(files, () => {
        console.log("loaded");

        //load noise
        const noisePanner = new Tone.Panner({ pan: 1 }).toDestination();//pan right = 1, pan left = -1
        store.noisePlayer = new Tone.Player().connect(noisePanner)
        store.noisePlayer.buffer = store.soundLibrary.get("ss_noise")

        state.value = "ready";
        //router.push("/calibration")
    });

}

const formValid = ref();
const pidrule = (v) => {
    if(v===null || v === ""){
        return "Please enter a value";
    }
    const reg = /^(?:[1-9]\d*|0)-(?:[1-9]\d*|0)$/;
    if(reg.test(v) == false){
        return "Please enter a valid participant ID, e.g. 333-21";
    }
    return true;
}

const pid = ref(null);
const submit = async () => {
    await Tone.start();
    store.pid = pid.value;
    router.push("/calibration")
}

const beginEmbed = async () => {
    await Tone.start();
    router.push("/disclaimer")
}


</script>
