<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Settings } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

const props = defineProps<{
  hoveredPair?: [string, string] | null
  hoveredTokenContent?: string | null
}>()

const emit = defineEmits<{
  openSettings: []
}>()

const { tokens, state } = useBPE()

const textEditor = ref<HTMLElement | null>(null)
const isInitialized = computed(() => state.steps.length > 0)

const isTokenHighlighted = (index: number): boolean => {
  const token = tokens.value[index]
  if (!token) return false
  
  // Check if part of hovered pair
  if (props.hoveredPair && index < tokens.value.length - 1) {
    const [token1, token2] = props.hoveredPair
    const nextToken = tokens.value[index + 1]
    if (nextToken && token.content === token1 && nextToken.content === token2) {
      return true
    }
    if (index > 0) {
      const prevToken = tokens.value[index - 1]
      if (prevToken && prevToken.content === token1 && token.content === token2) {
        return true
      }
    }
  }

  // Check if matches hovered vocabulary token
  if (props.hoveredTokenContent) {
    return token.content === props.hoveredTokenContent
  }

  return false
}

const isPairStart = (index: number): boolean => {
  if (!props.hoveredPair || index >= tokens.value.length - 1) return false
  const token = tokens.value[index]
  const nextToken = tokens.value[index + 1]
  if (!token || !nextToken) return false
  
  const [token1, token2] = props.hoveredPair
  return token.content === token1 && nextToken.content === token2
}
</script>

<template>
  <div class="relative h-full flex flex-col">
    <!-- Main Token Display Area -->
    <div class="flex-1 overflow-auto p-6">
      <div v-if="!isInitialized" class="text-center text-slate-400 dark:text-slate-500 mt-20">
        <h1 class="text-2xl font-semibold mb-2">Byte-Pair Encoding Visualizer</h1>
        <p class="text-sm mb-4">Enter your training data and start the algorithm</p>
      </div>

      <!-- Token Display -->
      <div v-else class="token-container">
        <template v-for="(token, index) in tokens" :key="token.id">
          <span
            class="token-wrapper"
            :class="{
              highlighted: isTokenHighlighted(index),
              'pair-start': isPairStart(index)
            }"
          >
            <span
              class="token"
              :style="{ backgroundColor: token.color }"
            >
              <span class="token-content">{{ displayTokenContent(token.content) }}</span>
              <span class="token-id">{{ token.id }}</span>
            </span>
          </span>
        </template>
      </div>
    </div>

    <!-- Settings Button (Bottom Right) -->
    <button
      @click="emit('openSettings')"
      class="absolute bottom-4 right-4 p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all hover:scale-105"
      title="Settings"
    >
      <Settings :size="20" class="text-slate-600 dark:text-slate-400" />
    </button>
  </div>
</template>

<style scoped>
.token-container {
  font-size: 1.125rem;
  line-height: 2.5;
  display: flex;
  flex-wrap: wrap;
  gap: 0;
  align-items: center;
}

.token-wrapper {
  position: relative;
  display: inline-block;
  transition: all 0.2s ease;
}

.token-wrapper.highlighted {
  z-index: 10;
}

.token-wrapper.highlighted::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: rgba(59, 130, 246, 0.15);
  border: 2px solid rgba(59, 130, 246, 0.4);
  border-radius: 6px;
  z-index: -1;
  animation: highlight-pulse 1.5s ease-in-out infinite;
}

.token {
  position: relative;
  display: inline-block;
  padding: 2px 8px 14px 8px;
  margin: 2px;
  border-radius: 4px;
  white-space: pre;
  transition: transform 0.2s ease;
}

.token-wrapper.highlighted .token {
  transform: scale(1.05);
}

.token-content {
  display: inline-block;
  font-weight: 500;
  font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, monospace;
}

.token-id {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.625rem;
  color: rgba(0, 0, 0, 0.5);
  font-weight: 600;
}

@keyframes highlight-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>
