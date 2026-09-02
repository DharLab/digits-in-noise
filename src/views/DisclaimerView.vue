<template>
  <v-container class="text-center" style="max-width: 720px;">
    <v-sheet border rounded="lg" color="blue-lighten-5" class="pa-6 mx-auto mb-8" max-width="640">
      <p>For best results, please make sure that you're in a quiet place.</p>
      <p>Ensure that your headphones are plugged in (or paired).</p>
    </v-sheet>

    <v-icon size="120" class="my-6">headphones</v-icon>

    <div class="d-flex justify-center">
      <v-checkbox v-model="agreed" hide-details density="compact"
        label="By continuing, you agree to the disclaimer."></v-checkbox>
    </div>

    <div class="d-flex justify-center mt-6">
      <v-btn variant="outlined" class="mr-3" @click="router.push('/')">
        <v-icon>chevron_left</v-icon>
      </v-btn>
      <v-btn size="large" color="primary" :disabled="!agreed" @click="next">
        I'm Ready <v-icon>chevron_right</v-icon>
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { UseStore } from '@/stores/UseStore';

const router = useRouter();
const store = UseStore();
const agreed = ref(false);

onMounted(() => {
  if (store.soundLibrary == null) router.push('/');
});

const next = () => router.push('/level');
</script>
