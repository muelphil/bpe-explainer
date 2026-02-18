<script setup lang="ts">
import { computed } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'

const { compressionRatio, tokens, state } = useBPE()

const collapsedContent = computed(() => {
  return `${compressionRatio.value.toFixed(2)}x compression`
})

const originalTokenCount = computed(() => state.trainingData.length)
const currentTokenCount = computed(() => tokens.value.length)
const percentReduction = computed(() => {
  if (originalTokenCount.value === 0) return 0
  return ((1 - currentTokenCount.value / originalTokenCount.value) * 100).toFixed(1)
})
</script>

<template>
  <CollapsiblePanel title="Compression" :collapsedContent="collapsedContent">
    <!-- Main Ratio Display -->
    <div class="text-center mb-4">
      <div class="text-4xl font-bold text-primary-500">
        {{ compressionRatio.toFixed(2) }}×
      </div>
      <div class="text-sm text-slate-500 dark:text-slate-400 mt-1">
        Compression Ratio
      </div>
    </div>

    <!-- Visual Bar -->
    <div class="mb-4">
      <div class="flex items-center gap-2 mb-2">
        <div class="flex-1 h-6 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden relative">
          <div
            class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-500"
            :style="{ width: `${(currentTokenCount / originalTokenCount) * 100}%` }"
          ></div>
          <div class="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-slate-100">
            {{ percentReduction }}% reduction
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="space-y-2 text-sm">
      <div class="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
        <span class="text-slate-600 dark:text-slate-400">Original Tokens:</span>
        <span class="font-semibold font-mono text-slate-900 dark:text-slate-100">
          {{ originalTokenCount }}
        </span>
      </div>
      <div class="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
        <span class="text-slate-600 dark:text-slate-400">Current Tokens:</span>
        <span class="font-semibold font-mono text-slate-900 dark:text-slate-100">
          {{ currentTokenCount }}
        </span>
      </div>
      <div class="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
        <span class="text-slate-600 dark:text-slate-400">Tokens Saved:</span>
        <span class="font-semibold font-mono text-primary-600 dark:text-primary-400">
          {{ originalTokenCount - currentTokenCount }}
        </span>
      </div>
    </div>

    <!-- Info -->
    <div class="mt-4 text-xs text-slate-500 dark:text-slate-400 italic">
      Compression ratio = Original tokens / Current tokens
    </div>
  </CollapsiblePanel>
</template>
