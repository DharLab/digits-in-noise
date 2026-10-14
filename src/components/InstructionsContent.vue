<template>
  <div class="text-center">
    <v-sheet border rounded="lg" color="blue-lighten-5" class="pa-8 mx-auto mb-8" max-width="680">
      <p :class="compact ? 'text-body-2' : 'text-h6 font-weight-regular'" style="line-height: 1.6;">You will hear three numbers at a time. The numbers will be played in the
        presence of background noise. Enter the numbers you hear in the sequence
        presented and press OK. If you can't hear the numbers clearly, make your
        best guess.</p>
    </v-sheet>

    <div v-if="!compact" class="mx-auto mb-4" style="width: max-content;">
      <div class="d-flex justify-center mb-4" style="gap: 32px;">
        <div class="digit-slot">4</div>
        <div class="digit-slot">5</div>
        <div class="digit-slot">6</div>
      </div>
      <div class="keypad">
        <v-btn v-for="n in [1, 2, 3, 4, 5, 6, 7, 8, 9]" :key="n" disabled variant="outlined" size="large">{{ n }}</v-btn>
        <v-btn disabled variant="outlined" size="large"><v-icon>chevron_left</v-icon></v-btn>
        <v-btn disabled variant="outlined" size="large">0</v-btn>
        <v-btn disabled variant="outlined" size="large">OK</v-btn>
      </div>
      <p class="text-body-1 text-medium-emphasis mt-3">Example</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // Smaller text, no example keypad — used by the small Instructions dropdown.
  compact: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped>
.digit-slot {
  width: 64px;
  border-bottom: 3px solid #555;
  font-size: 2.25rem;
}
.keypad {
  display: grid;
  grid-template-columns: repeat(3, 72px);
  gap: 24px;
  justify-content: center;
}
</style>
