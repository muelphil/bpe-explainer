<script setup lang="ts">
import { ref } from 'vue'
import { Play } from 'lucide-vue-next'

const emit = defineEmits<{
  initialize: [trainingData: string]
}>()

const trainingData = ref('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')

const handleInitialize = () => {
  if (trainingData.value.trim()) {
    emit('initialize', trainingData.value)
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-full p-8">
    <div class="max-w-2xl w-full space-y-6">
      <div class="text-center">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Byte-Pair Encoding Visualizer
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Visualize how BPE creates vocabularies for language models
        </p>
      </div>

      <div class="space-y-3">
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Training Data
        </label>
        <textarea
          v-model="trainingData"
          rows="8"
          class="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none font-mono text-sm"
          placeholder="Enter your training text here..."
        />
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ trainingData.length }} characters
        </p>
      </div>

      <button
        @click="handleInitialize"
        :disabled="!trainingData.trim()"
        class="w-full px-6 py-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 font-medium"
      >
        <Play :size="20" />
        Start BPE Algorithm
      </button>

      <div class="text-xs text-slate-500 dark:text-slate-400 text-center">
        Configure settings using the gear icon after initialization
      </div>
    </div>
  </div>
</template>
