<script setup lang="ts">
import { computed } from 'vue'
import { Lightbulb } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

const { currentStepData } = useBPE()

const summary = computed(() => {
  const step = currentStepData.value
  if (!step) return 'Training data is ready for BPE.'
  if (step.type === 'select' && step.selectedPair) {
    return `BPE selected ${displayTokenContent(step.selectedPair[0])} + ${displayTokenContent(step.selectedPair[1])} as the next most frequent pair.`
  }
  if (step.type === 'merge' && step.selectedPair && step.addedToken) {
    return `Merged ${displayTokenContent(step.selectedPair[0])} + ${displayTokenContent(step.selectedPair[1])} into ${displayTokenContent(step.addedToken.content)} and added it to the vocabulary.`
  }
  if (step.type === 'complete') return 'Training is complete. The vocabulary and ordered merge history now define the tokenizer.'
  return 'The corpus begins as its base tokens. BPE will repeatedly count and merge adjacent pairs.'
})
</script>

<template>
  <div class="mx-6 mt-4 flex items-start gap-2 rounded-lg border border-primary-100 bg-primary-50/70 px-3 py-2 text-sm text-primary-900 dark:border-primary-900/70 dark:bg-primary-950/30 dark:text-primary-100">
    <Lightbulb :size="17" class="mt-0.5 shrink-0 text-primary-600 dark:text-primary-400" />
    <p><span class="font-semibold">What changed:</span> {{ summary }}</p>
  </div>
</template>
