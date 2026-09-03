<template>
  <v-container>
    <div v-if="state == 'init'" class="text-center">
      <v-btn @click="startCountdown">Start</v-btn>
    </div>
    <div v-else-if="state == 'countdown'" class="text-center">
      <h1>{{ counter }}</h1>
    </div>
    <div v-else class="text-center">
      <div class="d-flex justify-center mb-4">
        <div class="blank-box mr-6">
          <h1>{{ enteredDigits[0] }}</h1>
        </div>
        <div class="blank-box mr-6">
          <h1>{{ enteredDigits[1] }}</h1>
        </div>
        <div class="blank-box">
          <h1>{{ enteredDigits[2] }}</h1>
        </div>
      </div>
      <div class="d-flex justify-center">
        <v-btn :disabled="disableNumberButtons" @click="numberClick(1)" size="x-large" class="mr-2 mb-2">1</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(2)" size="x-large" class="mr-2 mb-2">2</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(3)" size="x-large" class="mb-2">3</v-btn>
      </div>
      <div class="d-flex justify-center">
        <v-btn :disabled="disableNumberButtons" @click="numberClick(4)" size="x-large" class="mr-2 mb-2">4</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(5)" size="x-large" class="mr-2 mb-2">5</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(6)" size="x-large" class="mb-2">6</v-btn>
      </div>
      <div class="d-flex justify-center">
        <v-btn :disabled="disableNumberButtons" @click="numberClick(7)" size="x-large" class="mr-2 mb-2">7</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(8)" size="x-large" class="mr-2 mb-2">8</v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(9)" size="x-large" class="mb-2">9</v-btn>
      </div>
      <div class="d-flex justify-center">
        <v-btn :disabled="enteredDigits.length == 0" @click="deleteClick()" size="x-large"
          class="mr-2 mb-2"><v-icon>chevron_left</v-icon></v-btn>
        <v-btn :disabled="disableNumberButtons" @click="numberClick(0)" size="x-large" class="mr-2 mb-2">0</v-btn>
        <v-btn :disabled="enteredDigits.length != 3 || (!EMBED && isPlaying)" @click="nextClick()" size="x-large" class="mb-2">OK</v-btn>
      </div>
      <p class="mt-4 text-medium-emphasis">
      {{ currentTrial + "/" + totalTrials }}
      </p>
    </div>
    
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { UseStore } from '@/stores/UseStore';
import { EMBED } from '@/config';
//import UseWait from "@/composables/UseWait";
import PlayDigits from "@/composables/PlayDigits";
//import * as Tone from "tone";
import { onBeforeRouteLeave, useRouter } from 'vue-router';

const store = UseStore();
//const { wait } = UseWait();
const {play, stopPlayback, isPlaying, digitsArray} = PlayDigits();
const router = useRouter();

//loudest noise SNR is -24 (so max noise is +24) and softest noise SNR is 16 (so min noise is -16)
const maxNoiseVolume = 24;
const minNoiseVolume = -16;
let targetNoiseVolume = 0;
const totalTrials = 25; //total trials
const currentTrial = ref(1);


const state = ref("init"); //init, countdown, run
onMounted(() => {
  console.log(store.calibrationValid)
  if(store.calibrationValid == false){
    router.push("/")
  } else {
    state.value = "init";
    counter.value = 3;
  }
  
})


const counter = ref(3);
const startCountdown = () => {
  state.value = "countdown"
  const counterInt = setInterval(() => {
    counter.value -= 1;
    if (counter.value <= 0) {
      clearInterval(counterInt);
      state.value = "run";
      play(targetNoiseVolume);
    }
  }, 1000)
}

const enteredDigits = ref([]);
const disableNumberButtons = computed(() => enteredDigits.value.length >= 3 ? true : false);
const numberClick = (num) => {
  enteredDigits.value.push(num);
}

const deleteClick = () => {
  enteredDigits.value.pop();
}

const nextClick = async () => {
  currentTrial.value +=1;
  /*
  if(currentTrial.value > totalTrials){
    router.push("/end");
    return;
  }
  */
  //console.log(enteredDigits, digitsArray)
  if (enteredDigits.value[0] == digitsArray.value[0] &&
    enteredDigits.value[1] == digitsArray.value[1] &&
    enteredDigits.value[2] == digitsArray.value[2]
   ) {
    console.log("correct", store.currentSNR,);
    await store.addResponse({
      response: enteredDigits.value[0].toString()  + enteredDigits.value[1].toString() + enteredDigits.value[2].toString(),
      target: digitsArray.value[0].toString()  + digitsArray.value[1].toString() + digitsArray.value[2].toString(),
      snr: store.currentSNR,
      correct: true
    })
    //when correct answer is given, increase noise volume
    targetNoiseVolume +=2;
    if(targetNoiseVolume >= maxNoiseVolume){
      targetNoiseVolume = maxNoiseVolume;
    }
    enteredDigits.value = [];

    if(currentTrial.value > totalTrials){
      router.push("/end");
    } else {
      play(targetNoiseVolume);
    }
    
   } else {
    console.log("incorrect", store.currentSNR,);
    await store.addResponse({
      response: enteredDigits.value[0].toString()  + enteredDigits.value[1].toString() + enteredDigits.value[2].toString(),
      target: digitsArray.value[0].toString()  + digitsArray.value[1].toString() + digitsArray.value[2].toString(),
      snr: store.currentSNR,
      correct: false
    })
    //when correct answer is given, decrease noise volume
    targetNoiseVolume -=2;
    if(targetNoiseVolume <= minNoiseVolume){
      targetNoiseVolume = minNoiseVolume;
    }
    enteredDigits.value = [];
    
     if(currentTrial.value > totalTrials){
      router.push("/end");
    } else {
      play(targetNoiseVolume);
    }
   }
}


onBeforeRouteLeave((to, from, next)=>{
  if(EMBED){
    // Host owns navigation/chrome in the embed; no "unsaved changes" prompt.
    stopPlayback()
    next()
    return
  }
  console.log(to);
  if(to.path == "/end"){
    next()
  } else if(to.path =="/" && store.calibrationValid == false){
    next()
  } else {
    const answer = window.confirm('Do you really want to leave? You may have unsaved changes!')
    if (answer) {
      next()
    } else {
      next(false)
    }
  } 
})


//let digitsArray = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
//let isPlaying = ref(false);
//const playClicked = async (targetNoiseVolume) => {
//  console.log("target noise volume: " + targetNoiseVolume)
//  await play(targetNoiseVolume)
  //enteredDigits.value = [];
  //isPlaying.value = true;
  //clear previous entry
  

//}



</script>


<style scoped>
.blank-box {
  width: 80px;
  height: 48px;
  border-bottom: 1px solid black;
}
</style>