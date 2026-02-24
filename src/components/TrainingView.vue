<script setup lang="ts">
import {computed} from 'vue'
import {useBPE} from '../composables/useBPE'
import {displayTokenContent} from '../utils/tokenColor'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'

defineProps<{
  hoveredPair: [string, string] | null
  hoveredTokenContent: string | null
}>()

const {tokens} = useBPE()

// Group tokens into lines based on newlines for virtual scrolling
// Each "line" is an array of tokens between newlines
const tokenLines = computed(() => {
  const lines: Array<{ tokens: typeof tokens.value, lineIndex: number }> = []
  let currentLine: typeof tokens.value = []
  let lineIndex = 0

  tokens.value.forEach((token, index) => {
    currentLine.push(token)
    
    if (token.content.includes('\n')) {
      lines.push({ tokens: [...currentLine], lineIndex: lineIndex++ })
      currentLine = []
    }
  })

  // Add remaining tokens as last line
  if (currentLine.length > 0) {
    lines.push({ tokens: currentLine, lineIndex: lineIndex })
  }

  return lines
})

// Get global index for a token within a line
const getGlobalIndex = (lineIndex: number, tokenIndexInLine: number): number => {
  let globalIndex = 0
  for (let i = 0; i < lineIndex; i++) {
    // Guard against stale lineIndex during DynamicScroller re-renders (step transitions)
    globalIndex += tokenLines.value[i]?.tokens.length ?? 0
  }
  return globalIndex + tokenIndexInLine
}

// Check if a token should be highlighted (single token from vocabulary)
const isTokenHighlightedSingle = (token: {
  content: string
}, hoveredTokenContent: string | null): boolean => {
  return hoveredTokenContent !== null && token.content === hoveredTokenContent
}

// Check if this token is the first token of a hovered pair
const isPairLeft = (globalIndex: number, hoveredPair: [string, string] | null): boolean => {
  if (!hoveredPair || globalIndex >= tokens.value.length - 1) return false

  const currentToken = tokens.value[globalIndex]
  const nextToken = tokens.value[globalIndex + 1]

  if (!currentToken || !nextToken) return false

  return currentToken.content === hoveredPair[0] && nextToken.content === hoveredPair[1]
}

// Check if this token is the second token of a hovered pair
const isPairRight = (globalIndex: number, hoveredPair: [string, string] | null): boolean => {
  if (!hoveredPair || globalIndex === 0) return false

  const prevToken = tokens.value[globalIndex - 1]
  const currentToken = tokens.value[globalIndex]

  if (!prevToken || !currentToken) return false

  return prevToken.content === hoveredPair[0] && currentToken.content === hoveredPair[1]
}
</script>

<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden">
    <!-- Token Display Area with Virtual Scrolling -->
    <DynamicScroller
      :items="tokenLines"
      :min-item-size="30"
      class="flex-1 p-6"
      key-field="lineIndex"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[
            item.tokens.length,
          ]"
          :data-index="index"
        >
          <div class="token-container">
            <template v-for="(token, tokenIndex) in item.tokens" :key="`${token.id}-${tokenIndex}`">
              <span
                class="token-wrapper"
                :class="{
                  'highlight-single': isTokenHighlightedSingle(token, hoveredTokenContent),
                  'highlight-left': isPairLeft(getGlobalIndex(item.lineIndex, tokenIndex), hoveredPair),
                  'highlight-right': isPairRight(getGlobalIndex(item.lineIndex, tokenIndex), hoveredPair),
                }"
              >
                <span
                  class="token"
                  :style="token.color ? {backgroundColor: token.color} : {}"
                >{{ displayTokenContent(token.content) }}<span class="token-id">{{ token.id }}</span>
                </span>
              </span>
            </template>
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>
