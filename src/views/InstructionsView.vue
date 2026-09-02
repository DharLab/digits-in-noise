<template>
  <v-container class="text-center" style="max-width: 720px;">
    <v-sheet border rounded="lg" color="blue-lighten-5" class="pa-6 mx-auto mb-8" max-width="640">
      <p>You will hear three numbers at a time. The numbers will be played in the
        presence of background noise. Enter the numbers you hear in the sequence
        presented and press OK. If you can't hear the numbers clearly, make your
        best guess.</p>
    </v-sheet>

    <div class="mx-auto mb-8" style="width: max-content;">
      <div class="d-flex justify-center mb-3" style="gap: 24px;">
        <div class="digit-slot">4</div>
        <div class="digit-slot">5</div>
        <div class="digit-slot">6</div>
      </div>
      <div class="keypad">
        <v-btn v-for="n in keys" :key="n" disabled variant="outlined" size="small">{{ n }}</v-btn>
      </div>
      <p class="text-medium-emphasis mt-2">Example</p>
    </div>

    <v-btn size="large" color="primary" @click="router.push('/task')">
      Start <v-icon>chevron_right</v-icon>
    </v-btn>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { UseStore } from '@/stores/UseStore';

const router = useRouter();
const store = UseStore();
const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

onMounted(() => {
  if (store.calibrationValid == false) router.push('/');
});
</script>

<style scoped>
.digit-slot {
  width: 48px;
  border-bottom: 2px solid #555;
  font-size: 1.5rem;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 44px);
  gap: 8px;
  justify-content: center;
}
</style>
