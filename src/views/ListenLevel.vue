<template>
  <v-container>
    <div class="elevation-2">
      <v-tabs color="primary" v-model="tab" mandatory="" style="background-color: gainsboro;">
        <v-tab :value="1">Listening Level</v-tab>
        <v-tab :value="2">Confirm Calibration</v-tab>
      </v-tabs>

      <v-tabs-window v-model="tab">
        <v-tabs-window-item :value="1">
          <div class="pa-4">
            <p>Use the "Play Digits" button to play sample digits to the participant to obtain comfortable listening
              level.
            </p>

            <v-btn class="mt-2" :disabled="isPlaying" @click="play(-Infinity)" color="primary">
              Play Digits<v-icon>play_circle_filled</v-icon>
            </v-btn>
          </div>
        </v-tabs-window-item>
        <v-tabs-window-item :value="2">
          <div class="pa-4">
            <p>Use the "Play Calibration" button to play the calibration tone. Measure with sound level meter and
              confirm that output is at 65 (default) or 70 if the louder level is preferred.
            </p>
            <div v-if="!isPlaying">
            <v-btn  @click="playCalibrationTone('left')" :disabled="isPlaying" color="primary">
              Play Calibration Tone (Left)<v-icon>play_circle_filled</v-icon>
            </v-btn>
            <v-btn class="ml-2" @click="playCalibrationTone('right')" :disabled="isPlaying" color="primary">
              Play Calibration Tone (Right)<v-icon>play_circle_filled</v-icon>
            </v-btn>
            </div>
            <div v-else>
              <v-btn color="warning" @click="stopCalibrationTone()">Stop <v-icon>stop</v-icon></v-btn>
            </div>
          </div>
        </v-tabs-window-item>
      </v-tabs-window>

      <div class="pa-4">
        <v-radio-group v-model="store.listenLevel" hide-details :disabled="isPlaying">
          <v-radio label="65dB (default)" :value="65"></v-radio>
          <v-radio label="70dB" :value="70"></v-radio>
        </v-radio-group>
      </div>
    </div>
    <v-btn :disabled="isPlaying" class="mt-4" size="large" color="primary" @click="nextClicked">Next
          <v-icon>chevron_right</v-icon></v-btn>
  </v-container>
</template>

<script setup>
import { UseStore } from '@/stores/UseStore';
import PlayDigits from '@/composables/PlayDigits';
import { onMounted, ref } from 'vue';
import { useRouter } from "vue-router";

const store = UseStore();
const router = useRouter();
const tab = ref(1);
const { play, playCalibrationTone, stopCalibrationTone, isPlaying } = PlayDigits();

onMounted(() => {
  //check if calibration is valid. redirect back to preloader page if needed.
  if (store.calibrationValid == false) {
    router.push("/")
  }
})

const nextClicked = () => {
  router.push("/task");
}

</script>