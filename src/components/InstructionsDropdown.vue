<template>
  <div class="instructions-dropdown mx-auto mt-8 mb-4">
    <v-expansion-panels>
      <v-expansion-panel>
        <v-expansion-panel-title class="text-body-2">Instructions</v-expansion-panel-title>
        <v-expansion-panel-text>
          <InstructionsContent compact />
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
</template>

<script setup>
import InstructionsContent from './InstructionsContent.vue';
</script>

<style scoped>
.instructions-dropdown {
  width: 420px;
  max-width: calc(100vw - 24px);
}
</style>
