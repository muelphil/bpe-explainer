<script setup lang="ts">
import { computed } from 'vue'
import { Settings } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

defineProps<{
  hoveredPair: [string, string] | null
  hoveredTokenContent: string | null
}>()

const emit = defineEmits<{
  openSettings: []
}>()

const { tokens } = useBPE()

// Check if a token should be highlighted (single token from vocabulary)
const isTokenHighlightedSingle = (token: { content: string }, hoveredTokenContent: string | null): boolean => {
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
            :style="{
              backgroundColor: token.color
            }"
          >
            <span class="token-content">{{ displayTokenContent(token.content) }}</span>
            <span class="token-id">{{ token.id }}</span>
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
      <Settings :size="20" class="text-slate-700 dark:text-slate-300" />
    </button>
  </div>
</template>

<style scoped>
:root {
  --light-primary: rgb(147, 197, 253); /* primary-300 */
  --primary: rgb(96, 165, 250); /* primary-400 */
}

.dark {
  --light-primary: rgb(96, 165, 250); /* primary-400 */
  --primary: rgb(59, 130, 246); /* primary-500 */
}

.token-container {
  font-size: 1.125rem;
  //line-height: 2.5;
  display: flex;
  flex-wrap: wrap;
  gap: 0; /* No gap between wrappers - seamless */
  align-items: center;
}

.token-wrapper {
  position: relative;
  display: inline-block;
  padding: 2px; /* Padding on wrapper creates visual spacing */
  transition: all 0.2s ease;
  font-size: 0.875rem;
  margin: 1px 0;
}

.token {
  position: relative;
  display: inline-block;
  padding: 2px 8px 14px 8px;
  border-radius: 4px;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
  font-size: 0.875rem;
  white-space: pre;
  transition: all 0.2s ease;
}

.token-content {
  font-weight: 500;
}

.token-id {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.5rem;
  /*  font-size: 0.625rem; */
  color: rgb(100, 116, 139); /* slate-500 */
  font-weight: 600;
}

.dark .token-id {
  color: rgb(148, 163, 184); /* slate-400 */
}

/* Single token highlight (vocabulary hover) - token changes to primary color */
.highlight-single .token {
  background-color: var(--primary) !important;
}

/* Pair highlighting (frequency hover) - wrapper gets light background, token gets primary */
.highlight-left {
  border-radius: 6px 0 0 6px;
  background: var(--light-primary);
}

.highlight-right {
  border-radius: 0 6px 6px 0;
  background: var(--light-primary);
}

/* Tokens inside highlighted pair also get primary color */
.highlight-left .token,
.highlight-right .token {
  background-color: var(--primary) !important;
}

/* Token inside highlighted pair wrapper - adjust border radius to match wrapper */
/*
.highlight-left .token {
  border-radius: 4px 0 0 4px;
}

.highlight-right .token {
  border-radius: 0 4px 4px 0;
}
 */
</style>
