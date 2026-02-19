<script setup lang="ts">
import {computed} from 'vue'
import {Settings} from 'lucide-vue-next'
import {useBPE} from '../composables/useBPE'
import {displayTokenContent} from '../utils/tokenColor'

defineProps<{
  hoveredPair: [string, string] | null
  hoveredTokenContent: string | null
}>()

const emit = defineEmits<{
  openSettings: []
}>()

const {tokens} = useBPE()

// Check if a token should be highlighted (single token from vocabulary)
const isTokenHighlightedSingle = (token: {
  content: string
}, hoveredTokenContent: string | null): boolean => {
  return hoveredTokenContent !== null && token.content === hoveredTokenContent
}

// Check if this token is the first token of a hovered pair
const isPairLeft = (index: number, hoveredPair: [string, string] | null): boolean => {
  if (!hoveredPair || index >= tokens.value.length - 1) return false

  const currentToken = tokens.value[index]
  const nextToken = tokens.value[index + 1]

  if (!currentToken || !nextToken) return false

  return currentToken.content === hoveredPair[0] && nextToken.content === hoveredPair[1]
}

// Check if this token is the second token of a hovered pair
const isPairRight = (index: number, hoveredPair: [string, string] | null): boolean => {
  if (!hoveredPair || index === 0) return false

  const prevToken = tokens.value[index - 1]
  const currentToken = tokens.value[index]

  if (!prevToken || !currentToken) return false

  return prevToken.content === hoveredPair[0] && currentToken.content === hoveredPair[1]
}
</script>

<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden relative">
    <!-- Token Display Area -->
    <div class="flex-1 overflow-auto p-8">
      <div class="token-container">
        <span
          v-for="(token, index) in tokens"
          :key="`${token.id}-${index}`"
          class="token-wrapper"
          :class="{
            'highlight-single': isTokenHighlightedSingle(token, hoveredTokenContent),
            'highlight-left': isPairLeft(index, hoveredPair),
            'highlight-right': isPairRight(index, hoveredPair)
          }"
        >
          <span
            class="token"
            :style="{backgroundColor: token.color}"
          >{{ displayTokenContent(token.content) }}<span class="token-id">{{ token.id }}</span>
          </span>
        </span>
      </div>
    </div>

    <!-- Settings Button -->
    <button
      @click="emit('openSettings')"
      class="absolute bottom-4 right-4 p-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full shadow-lg transition-colors"
      title="Settings"
    >
      <Settings :size="20" class="text-slate-700 dark:text-slate-300"/>
    </button>
  </div>
</template>


