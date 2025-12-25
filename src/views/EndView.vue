<template>
    <v-container>
        <h2 class="text-center"> Digits in Noise Completed </h2>
        <div class="d-flex justify-center">
            <v-btn color="primary" @click="download">Download <v-icon>file_download</v-icon></v-btn>
        </div>
    </v-container>
</template>

<script setup>

import { UseStore } from '@/stores/UseStore';
import { saveAs } from 'file-saver';
//import { getUnixTime } from "date-fns";

const store = UseStore();
const download = () => {
    //calculate score
    //average the last 19 trials or 25 trials. startIndex 25 - 19
    const startIndex = 6
    let sum = 0;
    let count = 0
    for(let r=startIndex;r<store.responses.length;r++){
        sum += store.responses[r].snr
        count +=1;
    }
    let average = sum/count;

    //construct json output
    let output = {};
    output.srt = average;
    output.responses = store.responses

    const blob = new Blob([JSON.stringify(output, null, 2)], {type: "application/json"});
    saveAs(blob, store.pid + "_DIN.json");
}


</script>