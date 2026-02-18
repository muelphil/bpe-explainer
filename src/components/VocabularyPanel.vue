<script setup lang="ts">
import { computed } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

const emit = defineEmits<{
  hoverToken: [content: string | null]
}>()

const { vocabulary, currentStep } = useBPE()

const collapsedContent = computed(() => {
  if (vocabulary.value.length === 0) return 'Empty vocabulary'
  
  const lastAdded = vocabulary.value
    .filter(v => v.addedAtStep === currentStep.value)
    .pop()
  
  if (lastAdded) {
    return `${vocabulary.value.length} tokens | Last: "${displayTokenContent(lastAdded.content)}"`
  }
  
  return `${vocabulary.value.length} tokens`
})

const handleTokenHover = (content: string | null) => {
  emit('hoverToken', content)
}
</script>

<template>
  <CollapsiblePanel title="Vocabulary" :collapsedContent="collapsedContent">
    <div v-if="vocabulary.length === 0" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
      No tokens in vocabulary
    </div>
    
    <div v-else class="grid grid-cols-4 gap-2">
      <div
        v-for="token in vocabulary"
        :key="token.id"
        class="relative group"
        @mouseenter="handleTokenHover(token.content)"
        @mouseleave="handleTokenHover(null)"
      >
        <!-- Token Display -->
        <div
          class="px-2 py-1 rounded text-center cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg"
          :style="{ backgroundColor: token.color }"
          :class="{
            'ring-2 ring-accent-400': token.addedAtStep === currentStep
          }"
        >
          <div class="text-xs font-mono font-medium truncate" :title="token.content">
            {{ displayTokenContent(token.content) }}
          </div>
          <div class="text-[0.5rem] text-slate-600 dark:text-slate-400">
            {{ token.id }}
          </div>
        </div>

        <!-- Tooltip on hover -->
        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          Token #{{ token.id }}
          <span v-if="token.addedAtStep > 0"> (Step {{ token.addedAtStep }})</span>
        </div>
      </div>
    </div>

    <!-- Summary Stats -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
      <div class="flex justify-between">
        <span>Total Tokens:</span>
        <span class="font-semibold">{{ vocabulary.length }}</span>
      </div>
      <div class="flex justify-between mt-1">
        <span>Longest Token:</span>
        <span class="font-semibold font-mono">
          {{ Math.max(...vocabulary.map(v => v.content.length), 0) }} chars
        </span>
      </div>
    </div>
  </CollapsiblePanel>
</template>
