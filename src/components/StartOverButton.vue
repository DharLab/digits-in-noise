<template>
  <div v-if="visible" class="text-center mt-2 mb-8">
    <v-btn variant="text" size="small" color="error" @click="confirmAndReset">
      <v-icon size="18" class="mr-1">restart_alt</v-icon> Start Over
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { UseStore } from '@/stores/UseStore';
import PlayDigits from '@/composables/PlayDigits';

const router = useRouter();
const store = UseStore();
const { stopPlayback } = PlayDigits();

// Only meaningful once there's an actual calibration to run the test with.
const visible = computed(() => store.calibrationValid);

const confirmAndReset = () => {
  if (!window.confirm('Start over? This will restart the test from trial 1.')) return;
  // Same-route query-only navigations don't fire TaskView's onBeforeRouteLeave, so cut
  // any in-flight trial audio here instead of waiting for the new instance's first play().
  stopPlayback();
  // Clear prior trial data so the next run's JSON isn't mixed with the old one.
  store.responses = null;
  store.currentSNR = null;
  // ?restart= bypasses the one-way lock (see router/index.js) and gives RouterView's
  // :key a new fullPath each time, forcing TaskView to remount even if already on /task.
  router.push({ path: '/task', query: { restart: String(Date.now()) } });
};
</script>
