<template>
    <v-container class="d-flex flex-column align-center justify-center text-center" style="min-height: 90vh;">
        <div v-if="state == 'loading'">
            Loading... Please wait
        </div>

        <!-- Embed: no participant ID. Just a start gate so Tone.start() has a user gesture. -->
        <div v-else-if="EMBED" class="text-center">
            <p class="mb-4">Put on your headphones and find a quiet place. When you're ready, begin.</p>
            <v-btn color="primary" size="large" @click="beginEmbed">
                Begin <v-icon>chevron_right</v-icon>
            </v-btn>
        </div>

        <v-form v-else @submit.prevent="submit" v-model="formValid" style="width: 100%; max-width: 420px;">
            <h2 class="text-h5 font-weight-bold mb-6">Enter Participant ID</h2>
            <v-text-field v-model="pid" variant="outlined" density="comfortable" autofocus
                placeholder="e.g. 123-45" :rules="[pidrule]"></v-text-field>

            <v-radio-group v-model="store.audioMode" label="Audio Presentation" density="compact" hide-details class="mt-2 text-left">
                <v-radio label="Unilateral (digit left ear / noise right ear)" value="unilateral"></v-radio>
                <v-radio label="Bilateral (both ears)" value="bilateral"></v-radio>
            </v-radio-group>

            <v-btn class="mt-6" size="large" type="submit" :disabled="!formValid" color="primary">Next
                <v-icon>chevron_right</v-icon></v-btn>
            <p class="text-caption text-medium-emphasis mt-8">Last updated {{ lastUpdated }}</p>
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

// Reflects when this build was actually produced (see __APP_BUILD_DATE__ in vite.config.js),
// instead of a hand-edited date that goes stale.
const lastUpdated = new Date(__APP_BUILD_DATE__).toLocaleDateString(undefined, {
    year: "numeric", month: "long", day: "numeric",
});
onMounted(() => {
    // Embed has no audioMode toggle (no clinician present); the host site picks it for
    // us per-deployment via a query param on the iframe src (see auditory-wellness's
    // DinComponent.vue), e.g. index.html?audioMode=bilateral. Falls back to the
    // store's 'unilateral' default if absent/invalid.
    if (EMBED) {
        const mode = new URLSearchParams(window.location.search).get("audioMode");
        if (mode === "unilateral" || mode === "bilateral") {
            store.audioMode = mode;
        }
    }
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
        // Only the flat-intonation take (_2) is ever played in the task; the _1/_3
        // takes aren't used anywhere, so don't require them to exist.
        files["n" + d + "_2"] = B + "sounds/newSR_" + d + "_2_rs.wav";
    }

    store.soundLibrary = new Tone.ToneAudioBuffers(files, () => {
        console.log("loaded");

        //load noise
        const noisePanner = new Tone.Panner({ pan: 1 }).toDestination();//pan right = 1, pan left = -1 (play() updates this live per store.audioMode)
        store.noisePanner = noisePanner;
        store.noisePlayer = new Tone.Player().connect(noisePanner)
        store.noisePlayer.buffer = store.soundLibrary.get("ss_noise")

        // Second copy, fixed pan +1 - only used by Researcher Calibration + Bilateral
        // (play()'s dualChannel branch). Cheap to always create: same already-decoded buffer.
        const noisePannerB = new Tone.Panner({ pan: 1 }).toDestination();
        store.noisePannerB = noisePannerB;
        store.noisePlayerB = new Tone.Player().connect(noisePannerB)
        store.noisePlayerB.buffer = store.soundLibrary.get("ss_noise")

        state.value = "ready";
        //router.push("/calibration")
    });

}

const formValid = ref();
const pidrule = (v) => {
    if(!v || !String(v).trim()){
        return "Please enter a value";
    }
    return true;
}

const pid = ref(null);
const submit = async () => {
    await Tone.start();
    store.pid = pid.value;
    router.push("/disclaimer")
}

const beginEmbed = async () => {
    await Tone.start();
    router.push("/disclaimer")
}


</script>
