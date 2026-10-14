<template>
  <v-container class="text-center" style="max-width: 720px;">
    <InstructionsContent />

    <v-btn size="large" color="primary" @click="router.push('/task')">
      Start <v-icon>chevron_right</v-icon>
    </v-btn>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { UseStore } from '@/stores/UseStore';
import { EMBED } from '@/config';
import InstructionsContent from '@/components/InstructionsContent.vue';

const router = useRouter();
const store = UseStore();

onMounted(() => {
  if (store.calibrationValid == false) router.push(EMBED ? '/' : '/preloader');
});
</script>
