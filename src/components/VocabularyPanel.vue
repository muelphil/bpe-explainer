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

const expanded = defineModel<boolean>('expanded', { default: true })

const {vocabulary, currentStep, steps, tokens} = useBPE()

const lastAddedToken = computed(() => {
  // Find the last merge step at or before the current step
  for (let i = currentStep.value; i >= 0; i--) {
    const step = steps.value[i]
    if (step && step.type === 'merge' && step.addedToken) {
      return step.addedToken
    }
  }
  return null
})

// Derive both usedTokenIds set and count in a single pass over the token array
const usedTokensInfo = computed(() => {
  const ids = new Set<number>()
  for (const t of tokens.value) ids.add(t.id)
  return ids
})

// Count unique tokens currently used in the token array
const tokensUsed = computed(() => usedTokensInfo.value.size)

// Get set of token IDs currently used in training data
const usedTokenIds = computed(() => usedTokensInfo.value)

// Check if a token is used in the current training data
const isTokenUsed = (tokenId: number): boolean => {
  return usedTokenIds.value.has(tokenId)
}

const longestTokenLength = computed(() =>
  vocabulary.value.reduce((max, v) => Math.max(max, v.content.length), 0)
)

const handleTokenHover = (content: string | null) => {
  emit('hoverToken', content)
}

const isTokenHighlighted = (tokenContent: string, hoveredTokenContent: string | null): boolean => {
  return hoveredTokenContent !== null && tokenContent === hoveredTokenContent
}
</script>

<template>
  <CollapsiblePanel title="Vocabulary" v-model:expanded="expanded" tourId="vocabulary">
    <!-- Critical Info (always visible) -->
    <template #critical>
      <div v-if="vocabulary.length === 0" class="text-sm text-slate-500 dark:text-slate-400">
        Empty vocabulary
      </div>
      <div v-else class="flex items-center justify-between p-2" style="min-height: 22px">
        <div class="text-sm text-slate-700 dark:text-slate-300">
          <span class="font-semibold">{{ vocabulary.length }}</span> tokens
        </div>
        <div v-if="lastAddedToken" class="flex items-center gap-2">
          <span class="text-xs text-slate-500 dark:text-slate-400">Last added:</span>
            <span class="token small">
              {{ displayTokenContent(lastAddedToken.content) }}
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
            'highlight-single': isTokenHighlighted(token.content, hoveredTokenContent),
            'token-unused': !isTokenUsed(token.id)
          }"
          style="margin: 0; padding: 0;"
          @mouseenter="handleTokenHover(token.content)"
          @mouseleave="handleTokenHover(null)"
        >
          <span
            class="token relative group cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg"
            style="transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;"
            :style="token.color ? { backgroundColor: token.color } : {}"
          >
            <span class="token-content">{{ displayTokenContent(token.content) }}</span>
            <span class="token-id">{{ token.id }}</span>

            <!-- Tooltip on hover (disabled: clips with overflow-hidden parent, needs rewrite)
            <span
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
              Token #{{ token.id }}
              <span v-if="token.addedAtStep > 0"> (Step {{ token.addedAtStep }})</span>
            </span>
            -->
          </span>
        </span>
      </div>

      <!-- Summary Stats -->
      <div class="-mx-4 mt-4 pt-4 px-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
        <div class="flex justify-between">
          <span>Tokens Used:</span>
          <span class="font-semibold">{{ tokensUsed }}</span>
        </div>
        <div class="flex justify-between mt-1">
          <span>Longest Token:</span>
          <span class="font-semibold font-mono">
            {{ longestTokenLength }} chars
          </span>
        </div>
      </div>
    </template>
  </CollapsiblePanel>
</template>
