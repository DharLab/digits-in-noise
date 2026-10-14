<template>
  <v-container>
    <h2>Researcher Calibration</h2>

    <div class="d-flex align-center">
      <v-file-input @update:modelValue="fileLoaded" density="compact" max-width="300" hide-details=""
        label="Load Calibration File"></v-file-input>
      <p class="ml-2 mr-2">/ or /</p>
      <v-btn color="blue-lighten-3" @click="calibrationDialog = true">New Calibration File</v-btn>
    </div>
    <v-btn class="mt-6" size="large" to="/level" color="primary" :disabled="nextDisabled">Next
      <v-icon>chevron_right</v-icon></v-btn>
    <div v-if="nextDisabled == false" class="mt-6">
      <p>Calibration loaded</p>
      <ul class="ml-6">
        <li>Left Zero SPL: {{ store.leftZeroSPL }} dB SPL</li>
        <li>Right Zero SPL: {{ store.rightZeroSPL }} dB SPL</li>
      </ul>
    </div>

    <p class="mt-8">
      <router-link to="/calibration" class="text-caption text-medium-emphasis">
        Back to Patient Calibration
      </router-link>
    </p>

    <v-expansion-panels class="mt-6">
      <v-expansion-panel>
        <v-expansion-panel-title>Calibration Procedure</v-expansion-panel-title>
        <v-expansion-panel-text>
          <ol class="pl-4">
            <li>Connect the Zwislocki coupler to the Sound Level Meter.</li>
            <li>Insert the probe into the coupler with a Green 9mm Tip.</li>
            <li>
              Appropriate coupler for different acoustic transducers:
              <ol class="pl-4 mt-1">
                <li>Insert phones or probes: Appropriate 2cc coupler such as the GRAS RA0038 2cc Coupler or equivalent.</li>
                <li>Supra-aural headphones: Appropriate 6cc coupler such as the Larson Davis AEC201-A or equivalent.</li>
                <li>Circumaural headphones: Same as above with correct adapter plate.</li>
              </ol>
            </li>
            <li>Press "New Calibration File".</li>
            <li>Present the calibration tone in the L channel by clicking the "Play Left Channel Tone".</li>
            <li>Type in the SPL reading for the L channel.</li>
            <li>Repeat for the R channel.</li>
            <li>Save.</li>
          </ol>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
  <v-dialog v-model="calibrationDialog" max-width="700">
    <CalibrationComp @saveClicked="saveCalibration" @cancelClicked="calibrationDialog = false"></CalibrationComp>
  </v-dialog>
</template>


<script setup>
import CalibrationComp from '@/components/CalibrationComp.vue';
import { computed, onMounted, ref } from 'vue';
import { UseStore } from "@/stores/UseStore";
import { saveAs } from 'file-saver';
import { useRouter } from 'vue-router';

const store = UseStore();
const router = useRouter();

onMounted(()=>{
  //check if sounds have been preloded. redirect back to preloader page if needed.
  if(store.soundLibrary == null){
    router.push("/preloader")
    return;
  }
})

const calibrationDialog = ref(false);

const saveCalibration = async (leftZeroSPL, rightZeroSPL) => {
  let saveObj = {
    createDate: new Date().toLocaleString(),
    leftZeroSPL: leftZeroSPL,
    rightZeroSPL: rightZeroSPL
  }
  store.calibrationMode = 'file';
  var blob = new Blob([JSON.stringify(saveObj)], { type: "application/json" });
  await saveAs(blob, "calibration.json");
  calibrationDialog.value = false;
}

const fileLoaded = (f) => {
  if(f==null){
    return;
  }
  const reader = new FileReader();
  reader.onload = function () {
    let loadedCalibration = JSON.parse(reader.result);
    if(loadedCalibration.leftZeroSPL != null && loadedCalibration.rightZeroSPL != null){
      store.leftZeroSPL = loadedCalibration.leftZeroSPL;
      store.rightZeroSPL = loadedCalibration.rightZeroSPL;
      store.calibrationMode = 'file';
    }
  };
  reader.readAsText(f);
}

const nextDisabled = computed(() => store.leftZeroSPL == null || store.rightZeroSPL == null);
</script>