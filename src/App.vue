<template>
  <v-app>
    <v-main>
      <!-- Keyed on fullPath (not just path) so Start Over - which navigates to /task with a
           fresh ?restart= query each time - always remounts TaskView, even when already on /task. -->
      <RouterView :key="route.fullPath" />
      <template v-if="route.path === '/task'">
        <InstructionsDropdown />
        <StartOverButton />
      </template>
    </v-main>
  </v-app>
</template>

<script setup>
import { useRoute } from 'vue-router';
import InstructionsDropdown from '@/components/InstructionsDropdown.vue';
import StartOverButton from '@/components/StartOverButton.vue';

const route = useRoute();
</script>
