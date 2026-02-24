<script setup lang="ts">
import { ref } from 'vue'
import { trainingPresets } from '../data/trainingPresets'

const emit = defineEmits<{
  startTraining: [trainingData: string]
}>()

const LS_CUSTOM_DATA = 'bpe-custom-training-data'
const LS_SELECTED_PRESET = 'bpe-selected-preset'

const savedPresetId = localStorage.getItem(LS_SELECTED_PRESET)
const savedCustomData = localStorage.getItem(LS_CUSTOM_DATA)

// Restore: custom data takes priority if present, otherwise restore last preset
let initialPresetId: string | null
let initialData: string

if (savedCustomData !== null) {
  initialPresetId = null
  initialData = savedCustomData
} else {
  // Fall back to saved preset id, or the default
  const presetId = savedPresetId ?? 'lorem-ipsum'
  const preset = trainingPresets.find(p => p.id === presetId) ?? trainingPresets.find(p => p.id === 'lorem-ipsum')
  initialPresetId = preset?.id ?? null
  initialData = preset?.data ?? ''
}

const selectedPresetId = ref<string | null>(initialPresetId)
const trainingData = ref(initialData)

const selectPreset = (presetId: string) => {
  selectedPresetId.value = presetId
  const preset = trainingPresets.find(p => p.id === presetId)
  if (preset) {
    trainingData.value = preset.data
  }
  // Save selected preset; remove any stored custom data
  localStorage.setItem(LS_SELECTED_PRESET, presetId)
  localStorage.removeItem(LS_CUSTOM_DATA)
}

const handleInput = () => {
  // Deselect preset visually when user edits — don't save yet
  selectedPresetId.value = null
}

const handleStartTraining = () => {
  if (!trainingData.value.trim()) return

  // Persist state: save custom data if no preset is active, otherwise preset ID is already saved
  if (selectedPresetId.value === null) {
    localStorage.setItem(LS_CUSTOM_DATA, trainingData.value)
    localStorage.removeItem(LS_SELECTED_PRESET)
  }

  emit('startTraining', trainingData.value)
}

// Expose method to trigger start training from parent
defineExpose({
  triggerStartTraining: handleStartTraining
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Content -->
    <div class="flex-1 overflow-y-auto px-6 py-6 flex flex-col">
      <div class="w-full flex flex-col flex-1">
        <!-- Message -->
        <p class="text-slate-600 dark:text-slate-400 mb-4">
          Define your Training Data or use one of the presets
        </p>

        <!-- Presets -->
        <div class="flex gap-2 flex-wrap mb-4">
          <button
            v-for="preset in trainingPresets"
            :key="preset.id"
            @click="selectPreset(preset.id)"
            :class="[
              'px-3 py-1.5 rounded-md border-2 transition-all font-medium text-xs',
              selectedPresetId === preset.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-primary-300 dark:hover:border-primary-600'
            ]"
          >
            {{ preset.name }}
          </button>
        </div>

        <!-- Training Data Input - takes remaining space -->
        <div class="flex-1 flex flex-col min-h-0 mb-2">
          <textarea
            v-model="trainingData"
            @input="handleInput"
            class="flex-1 w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm leading-relaxed resize-none"
            spellcheck="false"
          ></textarea>
        </div>

        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ trainingData.length }} characters
        </p>
      </div>
    </div>

    <!-- Start Training Button - Fixed at bottom -->
    <div class="px-6 pb-6">
      <div class="w-full">
        <button
          @click="handleStartTraining"
          :disabled="!trainingData.trim()"
          class="w-full px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-95 font-medium shadow-lg"
        >
          Start Training
        </button>
      </div>
    </div>
  </div>
</template>
