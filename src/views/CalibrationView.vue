<template>
  <v-container>
    <h2>Calibration</h2>
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
    router.push("/")
  }
})

const calibrationDialog = ref(false);

const saveCalibration = async (leftZeroSPL, rightZeroSPL) => {
  let saveObj = {
    createDate: new Date().toLocaleString(),
    leftZeroSPL: leftZeroSPL,
    rightZeroSPL: rightZeroSPL
  }
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
    }
  };
  reader.readAsText(f);
}

const nextDisabled = computed(() => store.leftZeroSPL == null || store.rightZeroSPL == null);
</script>