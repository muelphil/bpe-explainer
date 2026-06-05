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

// Group tokens into lines based on newlines for virtual scrolling.
// Stores index ranges instead of copying token sub-arrays to avoid
// allocating one new array per line per step change.
const tokenLineRanges = computed(() => {
  const ranges: Array<{ startIndex: number; endIndex: number; lineIndex: number }> = []
  const toks = tokens.value
  let lineStart = 0
  let lineIndex = 0

  for (let i = 0; i < toks.length; i++) {
    if (toks[i]!.content.includes('\n')) {
      ranges.push({ startIndex: lineStart, endIndex: i + 1, lineIndex: lineIndex++ })
      lineStart = i + 1
    }
  }

  if (lineStart < toks.length) {
    ranges.push({ startIndex: lineStart, endIndex: toks.length, lineIndex: lineIndex })
  }

  return ranges
})

// O(1) global index: just add the line's start offset to the in-line index.
const getGlobalIndex = (item: { startIndex: number }, tokenIndexInLine: number): number =>
  item.startIndex + tokenIndexInLine

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
      :items="tokenLineRanges"
      :min-item-size="30"
      class="flex-1 p-2 sm:p-6"
      key-field="lineIndex"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.endIndex - item.startIndex]"
          :data-index="index"
        >
          <div class="token-container">
            <template v-for="(token, tokenIndex) in tokens.slice(item.startIndex, item.endIndex)" :key="`${token.id}-${tokenIndex}`">
              <span
                class="token-wrapper"
                :class="{
                  'highlight-single': isTokenHighlightedSingle(token, hoveredTokenContent),
                  'highlight-left': isPairLeft(getGlobalIndex(item, tokenIndex as number), hoveredPair),
                  'highlight-right': isPairRight(getGlobalIndex(item, tokenIndex as number), hoveredPair),
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
