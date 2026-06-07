<template>
    <v-container>
        <div class="d-flex flex-column align-center" v-if="state == 'loading'">
            Loading... Please wait
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
    store.soundLibrary = new Tone.ToneAudioBuffers({
        ss_noise: "sounds/English_speech_shaped.wav",
        cal_tone: "sounds/cal_tone.wav",
        n0_1: "sounds/newSR_0_1_rs.wav",
        n0_2: "sounds/newSR_0_2_rs.wav",
        n0_3: "sounds/newSR_0_3_rs.wav",
        n1_1: "sounds/newSR_1_1_rs.wav",
        n1_2: "sounds/newSR_1_2_rs.wav",
        n1_3: "sounds/newSR_1_3_rs.wav",
        n2_1: "sounds/newSR_2_1_rs.wav",
        n2_2: "sounds/newSR_2_2_rs.wav",
        n2_3: "sounds/newSR_2_3_rs.wav",
        n3_1: "sounds/newSR_3_1_rs.wav",
        n3_2: "sounds/newSR_3_2_rs.wav",
        n3_3: "sounds/newSR_3_3_rs.wav",
        n4_1: "sounds/newSR_4_1_rs.wav",
        n4_2: "sounds/newSR_4_2_rs.wav",
        n4_3: "sounds/newSR_4_3_rs.wav",
        n5_1: "sounds/newSR_5_1_rs.wav",
        n5_2: "sounds/newSR_5_2_rs.wav",
        n5_3: "sounds/newSR_5_3_rs.wav",
        n6_1: "sounds/newSR_6_1_rs.wav",
        n6_2: "sounds/newSR_6_2_rs.wav",
        n6_3: "sounds/newSR_6_3_rs.wav",
        n7_1: "sounds/newSR_7_1_rs.wav",
        n7_2: "sounds/newSR_7_2_rs.wav",
        n7_3: "sounds/newSR_7_3_rs.wav",
        n8_1: "sounds/newSR_8_1_rs.wav",
        n8_2: "sounds/newSR_8_2_rs.wav",
        n8_3: "sounds/newSR_8_3_rs.wav",
        n9_1: "sounds/newSR_9_1_rs.wav",
        n9_2: "sounds/newSR_9_2_rs.wav",
        n9_3: "sounds/newSR_9_3_rs.wav"
    }, () => {
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


</script>