<script setup lang="ts">
import {computed} from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import {useBPE} from '../composables/useBPE'
import {displayTokenContent, getTokenColor} from '../utils/tokenColor'
import AppTooltip from './AppTooltip.vue'

const props = defineProps<{
  hoveredTokenContent: string | null
  initialExpanded?: boolean
}>()

const emit = defineEmits<{
  hoverToken: [content: string | null]
  expandedChange: [expanded: boolean]
}>()

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

const getTokenOrigin = (tokenContent: string): string | null => {
  const mergeStep = steps.value.find(step =>
    step.type === 'merge' &&
    step.addedToken?.content === tokenContent &&
    step.selectedPair
  )
  return mergeStep?.selectedPair
    ? `${displayTokenContent(mergeStep.selectedPair[0])} + ${displayTokenContent(mergeStep.selectedPair[1])}`
    : null
}
</script>

<template>
  <CollapsiblePanel title="Vocabulary" :initialExpanded="props.initialExpanded" @change="(v) => emit('expandedChange', v)">
    <!-- Critical Info (always visible) -->
    <template #critical>
      <div class="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Learned symbols available to BPE</span>
        <AppTooltip text="Hover a vocabulary token to highlight its current occurrences in the corpus.">
          <span tabindex="0" class="cursor-help underline decoration-dotted">How it works</span>
        </AppTooltip>
      </div>
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
          <AppTooltip
            :text="getTokenOrigin(token.content)
              ? `Token #${token.id}, learned at step ${token.addedAtStep} from ${getTokenOrigin(token.content)}.`
              : `Token #${token.id}, part of the base vocabulary.`"
          >
            <span
              tabindex="0"
              class="token relative cursor-pointer hover:scale-110 hover:z-10 hover:shadow-lg"
              style="transition: background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;"
              :style="token.color ? { backgroundColor: token.color } : {}"
            >
              <span class="token-content">{{ displayTokenContent(token.content) }}</span>
              <span class="token-id">{{ token.id }}</span>
            </span>
          </AppTooltip>
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
