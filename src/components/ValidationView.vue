<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useBPE } from '../composables/useBPE'
import { bpeService } from '../services/BPEService'
import { displayTokenContent } from '../utils/tokenColor'

const { state } = useBPE()

const inputText = ref('')
const editableDiv = ref<HTMLDivElement | null>(null)

// Tokenize input when it changes
const tokenizationResult = computed(() => {
  return state.vocabulary.length > 0
    ? bpeService.tokenizeInput(inputText.value)
    : { tokens: [], hasErrors: false, compressionRatio: 1 }
})

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
      <div class="px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Input
        </h2>
      </div>
      <div class="flex-1 px-6 pb-4 overflow-y-auto">
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
      <div class="px-6 py-4">
        <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Tokenized Input
          <span class="text-sm font-normal text-slate-600 dark:text-slate-400">
            (Compression Rate: {{ compressionPercentage }}%)
          </span>
        </h2>
      </div>
      <div class="flex-1 px-6 pb-4 overflow-y-auto">
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
                {{ displayTokenContent(token.content) }}
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
