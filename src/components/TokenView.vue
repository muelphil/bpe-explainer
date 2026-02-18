<script setup lang="ts">
import { ref, computed } from 'vue'

interface Token {
  id: number
  content: string
  color: string
  skipAnimation?: boolean
}

const mode = ref<'text' | 'token'>('text')
const textContent = ref('Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut lab')
const tokens = ref<Token[]>([])
const selectedIndices = ref<number[]>([])
const mergingIndices = ref<number[]>([])
const mergingColor = ref<string>('')
const animationDuration = ref(600)
let nextTokenId = 0

// Hash function to generate consistent colors with better distribution
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) + hash) + char // hash * 33 + char
  }
  // Mix the bits more to avoid similar adjacent values
  hash = hash ^ (hash >>> 16)
  hash = hash * 0x21f0aaad
  hash = hash ^ (hash >>> 15)
  hash = hash * 0x735a2d97
  hash = hash ^ (hash >>> 15)
  return Math.abs(hash)
}

function getTokenColor(content: string): string {
  const hash = hashString(content)
  // Use golden ratio for better color distribution
  const hue = (hash * 137.508) % 360
  const saturation = 55 + (hash % 30)
  const lightness = 70 + (hash % 20)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

async function tokenize() {
  if (mode.value === 'token') return

  const chars = textContent.value.split('')
  tokens.value = chars.map(char => ({
    id: nextTokenId++,
    content: char,
    color: getTokenColor(char),
    skipAnimation: false
  }))

  mode.value = 'token'

  // After animation completes, disable animation for all tokens
  await new Promise(resolve => setTimeout(resolve, animationDuration.value))
  tokens.value = tokens.value.map(token => ({ ...token, skipAnimation: true }))
}

function selectToken(index: number) {
  if (mergingIndices.value.length > 0) return

  if (selectedIndices.value.includes(index)) {
    selectedIndices.value = selectedIndices.value.filter(i => i !== index)
  } else {
    if (selectedIndices.value.length >= 2) {
      selectedIndices.value = [index]
    } else {
      selectedIndices.value = [...selectedIndices.value, index].sort((a, b) => a - b)
    }
  }
}

function canMerge(): boolean {
  if (selectedIndices.value.length !== 2) return false
  const [idx1, idx2] = selectedIndices.value
  return idx2 === idx1 + 1
}

async function mergeTokens() {
  if (!canMerge()) return

  const [idx1, idx2] = selectedIndices.value
  const newContent = tokens.value[idx1].content + tokens.value[idx2].content
  const newColor = getTokenColor(newContent)
  
  // Start merge animation (keep selection for wrapper, but visually hide it)
  mergingIndices.value = [idx1, idx2]
  mergingColor.value = newColor

  await new Promise(resolve => setTimeout(resolve, 400))

  const newToken: Token = {
    id: nextTokenId++,
    content: newContent,
    color: newColor,
    skipAnimation: true
  }

  tokens.value = [
    ...tokens.value.slice(0, idx1),
    newToken,
    ...tokens.value.slice(idx2 + 1)
  ]

  selectedIndices.value = []
  mergingIndices.value = []
  mergingColor.value = ''
}

function displayTokenContent(content: string): string {
  return content.replace(/ /g, '▁')
}

const isSelectionStart = (index: number) => {
  if (selectedIndices.value.length === 0) return false
  return selectedIndices.value[0] === index
}

const isSelectionEnd = (index: number) => {
  if (selectedIndices.value.length !== 2) return false
  return selectedIndices.value[1] === index
}

const isInSelection = (index: number) => {
  if (selectedIndices.value.length === 0) return false
  const [start, end] = selectedIndices.value.length === 1
    ? [selectedIndices.value[0], selectedIndices.value[0]]
    : selectedIndices.value
  return index >= start && index <= end
}

const isTokenSelected = (index: number) => selectedIndices.value.includes(index)
const isTokenMerging = (index: number) => mergingIndices.value.includes(index)
const isMergingLeft = (index: number) => mergingIndices.value[0] === index
const isMergingRight = (index: number) => mergingIndices.value[1] === index
</script>

<template>
  <div class="token-view-container">
    <!-- Token View Area -->
    <div class="token-area">
      <div
        v-if="mode === 'text'"
        class="text-editor"
        contenteditable
        @input="(e) => textContent = (e.target as HTMLElement).innerText"
        v-text="textContent"
      ></div>

      <div v-else class="token-container">
        <template v-for="(token, index) in tokens" :key="token.id">
          <span
            v-if="isSelectionStart(index)"
            class="selection-wrapper"
            :class="{ merging: mergingIndices.length > 0 }"
          >
            <span
              class="token-wrapper"
              :class="{
                selected: isTokenSelected(index),
                merging: isTokenMerging(index),
                'merging-left': isMergingLeft(index),
                'merging-right': isMergingRight(index)
              }"
              @click="selectToken(index)"
            >
              <span
                class="token"
                :class="{ 'skip-animation': token.skipAnimation }"
                :style="{
                  backgroundColor: isTokenMerging(index) ? mergingColor : token.color,
                  animationDuration: `${animationDuration}ms`
                }"
              >
                <span class="token-content">{{ displayTokenContent(token.content) }}</span>
                <span class="token-id">{{ token.id }}</span>
              </span>
            </span>
            <span
              v-if="selectedIndices.length === 2"
              class="token-wrapper"
              :class="{
                selected: isTokenSelected(index + 1),
                merging: isTokenMerging(index + 1),
                'merging-left': isMergingLeft(index + 1),
                'merging-right': isMergingRight(index + 1)
              }"
              @click="selectToken(index + 1)"
            >
              <span
                class="token"
                :class="{ 'skip-animation': tokens[index + 1].skipAnimation }"
                :style="{
                  backgroundColor: isTokenMerging(index + 1) ? mergingColor : tokens[index + 1].color,
                  animationDuration: `${animationDuration}ms`
                }"
              >
                <span class="token-content">{{ displayTokenContent(tokens[index + 1].content) }}</span>
                <span class="token-id">{{ tokens[index + 1].id }}</span>
              </span>
            </span>
          </span>
          <span
            v-else-if="!isSelectionEnd(index)"
            class="token-wrapper"
            :class="{
              selected: isTokenSelected(index),
              merging: isTokenMerging(index),
              'merging-left': isMergingLeft(index),
              'merging-right': isMergingRight(index)
            }"
            @click="selectToken(index)"
          >
            <span
              class="token"
              :class="{ 'skip-animation': token.skipAnimation }"
              :style="{
                backgroundColor: isTokenMerging(index) ? mergingColor : token.color,
                animationDuration: `${animationDuration}ms`
              }"
            >
              <span class="token-content">{{ displayTokenContent(token.content) }}</span>
              <span class="token-id">{{ token.id }}</span>
            </span>
          </span>
        </template>
      </div>
    </div>

    <!-- Control Panel -->
    <div class="control-panel">
      <button
        v-if="mode === 'text'"
        @click="tokenize"
        class="btn btn-primary"
      >
        Tokenize
      </button>

      <template v-else>
        <button
          @click="mergeTokens"
          :disabled="!canMerge()"
          class="btn btn-primary"
        >
          Merge Selected Tokens
        </button>
        <button
          @click="() => { mode = 'text'; selectedIndices = []; tokens = [] }"
          class="btn btn-secondary"
        >
          Reset
        </button>
      </template>

      <div class="control-group">
        <label for="animation-speed">Animation Duration:</label>
        <input
          id="animation-speed"
          v-model.number="animationDuration"
          type="range"
          min="100"
          max="2000"
          step="100"
          class="slider"
        />
        <span class="value-label">{{ animationDuration }}ms</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.token-view-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
}

.token-area {
  flex: 1;
  overflow: auto;
  padding: 2rem;
  background: #f8f9fa;
}

.text-editor {
  font-size: 1.125rem;
  line-height: 2;
  padding: 1rem;
  border: 2px solid #dee2e6;
  border-radius: 8px;
  background: white;
  min-height: 200px;
  outline: none;
  transition: border-color 0.2s;
}

.text-editor:focus {
  border-color: #4a90e2;
}

.token-container {
  font-size: 1.125rem;
  line-height: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: center;
}

.selection-wrapper {
  display: inline-block;
  padding: 1px;
  margin: -2px;
  background: rgba(255, 99, 71, 0.2);
  border: 1px solid rgba(255, 99, 71, 0.5);
  border-radius: 6px;
  transition: background 0.2s ease, border 0.2s ease;
}

.selection-wrapper.merging {
  background: transparent;
  border: 1px solid transparent;
}

.token-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
  transition: all 0.3s ease;
}

.token {
  position: relative;
  display: inline-block;
  padding: 2px 8px 14px 8px;
  margin: 2px;
  border-radius: 4px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: pre;
}

.token.skip-animation {
  animation: none !important;
}

.token-wrapper.merging .token {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.token-wrapper.merging-left .token {
  padding-right: 0;
  margin-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.token-wrapper.merging-right .token {
  padding-left: 0;
  margin-left: 0;
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.token-wrapper.merging .token-id {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.token-content {
  display: inline-block;
  font-weight: 500;
}

.token-id {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.625rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
  transition: opacity 0.2s ease;
}

.control-panel {
  display: flex;
  gap: 1rem;
  padding: 1.5rem 2rem;
  background: white;
  border-top: 1px solid #dee2e6;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
  align-items: center;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}

.control-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #495057;
}

.slider {
  width: 150px;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: #dee2e6;
  outline: none;
  border-radius: 3px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: #4a90e2;
  cursor: pointer;
  border-radius: 50%;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: #4a90e2;
  cursor: pointer;
  border-radius: 50%;
  border: none;
}

.value-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #495057;
  min-width: 60px;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4a90e2;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #357abd;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
}

/* Animation for text to token transition */
@keyframes tokenAppear {
  from {
    padding: 0;
    margin: 0;
    background-color: transparent;
  }
  to {
    padding: 2px 8px 14px 8px;
    margin: 2px;
  }
}

.token-wrapper .token:not(.skip-animation) {
  animation: tokenAppear ease-out;
}
</style>
