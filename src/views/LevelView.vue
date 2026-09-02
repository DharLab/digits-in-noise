<template>
  <v-container class="text-center" style="max-width: 720px;">
    <v-sheet border rounded="lg" color="blue-lighten-5" class="pa-6 mx-auto mb-12" max-width="600">
      <p>Set a comfortable level where you hear the speech clearly.</p>
    </v-sheet>

    <div class="d-flex align-center px-4" style="gap: 16px;">
      <v-icon size="32">volume_down</v-icon>
      <v-slider v-model="level" :min="MIN" :max="MAX" :step="1" hide-details
        color="primary" track-color="grey-lighten-1" thumb-label></v-slider>
      <v-icon size="32">volume_up</v-icon>
    </div>

    <v-btn class="mt-12" size="large" color="primary" @click="next">
      Next <v-icon>chevron_right</v-icon>
    </v-btn>
  </v-container>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { UseStore } from '@/stores/UseStore';
import PlayDigits from '@/composables/PlayDigits';

const router = useRouter();
const store = UseStore();
const { startLevelPreview, setLevelPreviewVolume, stopLevelPreview } = PlayDigits();

// dBFS range for the participant-set digit level. Kept below 0 to avoid clipping.
const MIN = -45;
const MAX = -6;
const DEFAULT = -18;

const level = ref(store.comfortDbfs ?? DEFAULT);

onMounted(() => {
  if (store.soundLibrary == null) {
    router.push('/');
    return;
  }
  store.comfortDbfs = level.value;
  startLevelPreview();
});

watch(level, (v) => {
  store.comfortDbfs = v;
  setLevelPreviewVolume(v);
});

onBeforeUnmount(() => stopLevelPreview());

const next = () => {
  stopLevelPreview();
  router.push('/instructions');
};
</script>
