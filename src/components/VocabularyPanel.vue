<script setup lang="ts">
import {computed} from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import {useBPE} from '../composables/useBPE'
import {displayTokenContent, getTokenColor} from '../utils/tokenColor'

defineProps<{
  hoveredTokenContent: string | null
}>()

const emit = defineEmits<{
  hoverToken: [content: string | null]
}>()

const {vocabulary, currentStep} = useBPE()

const lastAddedToken = computed(() => {
  return vocabulary.value
    .filter(v => v.addedAtStep === currentStep.value)
    .pop()
})

const handleTokenHover = (content: string | null) => {
  emit('hoverToken', content)
}

const isTokenHighlighted = (tokenContent: string, hoveredTokenContent: string | null): boolean => {
  return hoveredTokenContent !== null && tokenContent === hoveredTokenContent
}
</script>

<template>
  <CollapsiblePanel title="Vocabulary">
    <!-- Critical Info (always visible) -->
    <template #critical>
      <div v-if="vocabulary.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
        Empty vocabulary
      </div>
      <div v-else class="flex items-center justify-between">
        <div class="text-sm text-slate-700 dark:text-slate-300">
          <span class="font-semibold">{{ vocabulary.length }}</span> tokens
        </div>
        <div v-if="lastAddedToken" class="flex items-center gap-2">
          <span class="text-xs text-slate-500 dark:text-slate-400">Last added:</span>
          <span class="token-wrapper" style="margin: 0; padding: 0;">
            <span class="token no-id">
              {{ displayTokenContent(lastAddedToken.content) }}
            </span>
          </span>
        </div>
      </div>
    </template>

    <!-- Details (collapsible) -->
    <template #details>
      <div class="token-container" style="gap: 4px;">
        <span
          v-for="token in vocabulary"
          :key="token.id"
          class="token-wrapper"
          :class="{
            'highlight-single': isTokenHighlighted(token.content, hoveredTokenContent)
          }"
          style="margin: 0; padding: 0;"
          @mouseenter="handleTokenHover(token.content)"
          @mouseleave="handleTokenHover(null)"
        >
          <span
            class="token relative group cursor-pointer transition-all hover:scale-110 hover:z-10 hover:shadow-lg"
            :style="{ backgroundColor: token.color }"
          >
            <span class="token-content">{{ displayTokenContent(token.content) }}</span>
            <span class="token-id">{{ token.id }}</span>

            <!-- Tooltip on hover -->
            <span
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              Token #{{ token.id }}
              <span v-if="token.addedAtStep > 0"> (Step {{ token.addedAtStep }})</span>
            </span>
          </span>
        </span>
      </div>

      <!-- Summary Stats -->
      <div
        class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
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
    </template>
  </CollapsiblePanel>
</template>
