<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBPE } from '../composables/useBPE'
import { bpeService } from '../services/BPEService'
import { displayTokenContent } from '../utils/tokenColor'
import TokenMergeTree from './TokenMergeTree.vue'
import type { MergeNode } from './TokenMergeTree.vue'

const { state } = useBPE()

const inputText = ref('')
const editableDiv = ref<HTMLDivElement | null>(null)

// Tokenize input when it changes
const tokenizationResult = computed(() => {
  return state.vocabulary.length > 0
    ? bpeService.tokenizeInput(inputText.value)
    : { tokens: [], hasErrors: false, compressionRatio: 1 }
})

// Build a map from merged token content → [leftPart, rightPart] for hierarchy reconstruction
const mergeMap = computed(() => {
  const map = new Map<string, [string, string]>()
  for (const step of state.steps) {
    if (step.type === 'merge' && step.mergedPair && step.addedVocabEntry) {
      map.set(step.addedVocabEntry.content, step.mergedPair as [string, string])
    }
  }
  return map
})

// Recursively build a binary merge tree for a token content string
function buildMergeTree(content: string, map: Map<string, [string, string]>): MergeNode {
  const merge = map.get(content)
  if (!merge) return { content }
  return {
    content,
    left: buildMergeTree(merge[0], map),
    right: buildMergeTree(merge[1], map),
  }
}

// One merge tree per token in the current tokenization result
const tokenTrees = computed<MergeNode[]>(() => {
  const map = mergeMap.value
  return tokenizationResult.value.tokens.map(token => buildMergeTree(token.content, map))
})

// Returns the max depth of a merge tree (0 = leaf/single char, 1 = one merge, 2+ = nested)
function treeDepth(node: MergeNode): number {
  if (!node.left) return 0
  return 1 + Math.max(treeDepth(node.left), treeDepth(node.right!))
}

const handleInput = (event: Event) => {
  if (editableDiv.value) {
    inputText.value = editableDiv.value.textContent || ''
  }
}

// Watch inputText and update the div content if it changes programmatically
watch(inputText, (newValue) => {
  if (editableDiv.value && editableDiv.value.textContent !== newValue) {
    // Save cursor position
    const selection = window.getSelection()
    const range = selection?.getRangeAt(0)
    const cursorPos = range?.startOffset || 0

    editableDiv.value.textContent = newValue

    // Restore cursor position
    if (selection && editableDiv.value.firstChild) {
      try {
        const newRange = document.createRange()
        const textNode = editableDiv.value.firstChild
        const pos = Math.min(cursorPos, textNode.textContent?.length || 0)
        newRange.setStart(textNode, pos)
        newRange.setEnd(textNode, pos)
        selection.removeAllRanges()
        selection.addRange(newRange)
      } catch (e) {
        // If cursor restoration fails, just continue
      }
    }
  }
})

// Format compression ratio as percentage
const compressionPercentage = computed(() => {
  const ratio = tokenizationResult.value.compressionRatio
  return ((1 - 1 / ratio) * 100).toFixed(1)
})
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Input Section (33%) -->
    <div class="flex flex-col overflow-hidden" style="flex: 0 0 33%">
      <div class="px-2 sm:px-6 py-2 sm:py-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Input
        </h2>
      </div>
      <div class="flex-1 px-2 sm:px-6 pb-2 sm:pb-4 overflow-y-auto">
        <div
          ref="editableDiv"
          contenteditable="true"
          @input="handleInput"
          class="w-full h-full text-slate-900 dark:text-slate-100 focus:outline-none font-mono text-sm leading-relaxed whitespace-pre-wrap"
          spellcheck="false"
        ></div>
      </div>
    </div>

    <!-- Tokenized Output Section (66%) -->
    <div class="flex flex-col overflow-hidden border-t border-slate-200 dark:border-slate-700" style="flex: 0 0 67%">
      <div class="px-2 sm:px-6 py-2 sm:py-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Tokenized Input
          <span class="text-sm font-normal text-slate-600 dark:text-slate-400">
            (Compression Rate: {{ compressionPercentage }}%)
          </span>
        </h2>
      </div>
      <div class="flex-1 px-2 sm:px-6 pb-2 sm:pb-4 overflow-y-auto">
        <div class="token-container">
          <template v-if="tokenizationResult.tokens.length === 0">
            <span class="text-slate-400 dark:text-slate-500 italic text-sm">
              Enter text above to see tokenization
            </span>
          </template>
          <template v-else>
            <span
              v-for="(token, index) in tokenizationResult.tokens"
              :key="index"
              class="token-wrapper"
              :class="{ 'token-error': token.id === -1 }"
            >
              <span
                class="token"
                :style="token.id !== -1 && token.color ? { backgroundColor: token.color } : {}"
              >
                <TokenMergeTree v-if="treeDepth(tokenTrees[index]!) >= 2" :node="tokenTrees[index]!" :depth="0" /><template v-else>{{ displayTokenContent(token.content) }}</template>
                <span class="token-id">{{ token.id === -1 ? '?' : token.id }}</span>
              </span>
            </span>
          </template>
        </div>

        <!-- Error message if there are errors -->
        <div
          v-if="tokenizationResult.hasErrors"
          class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg"
        >
          <p class="text-sm text-red-800 dark:text-red-200">
            <strong>Warning:</strong> Some characters could not be tokenized with the current vocabulary.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/*
 * Equalize token heights within each flex row:
 * 1. Stretch all token-wrappers to the height of the tallest token in the row.
 * 2. token-wrapper becomes a flex column so it can pass its height down to .token.
 * 3. .token grows to fill the wrapper and centers its content vertically,
 *    so that shallow tokens (no inner merge structure) appear the same height
 *    as deeply-merged tokens whose nested borders add vertical space.
 */
.token-container {
  align-items: stretch;
}

.token-wrapper {
  display: flex;
  align-items: stretch;
}

.token {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex: 1;
  gap: 2px;
}
</style>
