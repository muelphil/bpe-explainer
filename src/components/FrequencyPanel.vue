<script setup lang="ts">
import { computed } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

const emit = defineEmits<{
  hoverPair: [pair: [string, string] | null]
}>()

const { frequencies } = useBPE()

const topFrequency = computed(() => frequencies.value[0] || null)
const remainingFrequencies = computed(() => frequencies.value.slice(1))

const handlePairHover = (pair: [string, string] | null) => {
  emit('hoverPair', pair)
}
</script>

<template>
  <CollapsiblePanel title="Frequency">
    <!-- Critical Info (always visible) - First item of list -->
    <template #critical>
      <div v-if="!topFrequency" class="text-sm text-slate-500 dark:text-slate-400">
        No pairs available
      </div>
      <div 
        v-else
        class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
        @mouseenter="handlePairHover(topFrequency.pair)"
        @mouseleave="handlePairHover(null)"
      >
        <!-- Token Pair Visualization -->
        <div class="flex items-center gap-0.5">
          <span
            class="inline-block px-2 py-0.5 text-xs font-mono rounded"
            :style="{ backgroundColor: getTokenColor(topFrequency.pair[0]) }"
          >
            {{ displayTokenContent(topFrequency.pair[0]) }}
          </span>
          <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
          <span
            class="inline-block px-2 py-0.5 text-xs font-mono rounded"
            :style="{ backgroundColor: getTokenColor(topFrequency.pair[1]) }"
          >
            {{ displayTokenContent(topFrequency.pair[1]) }}
          </span>
        </div>

        <!-- Frequency Count with Bar -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {{ topFrequency.frequency }}×
          </span>
          <div class="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div class="h-full bg-primary-500 transition-all" style="width: 100%"></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Details (collapsible) - Remaining items -->
    <template #details>
      <div class="space-y-2">
        <div
          v-for="(freq, index) in remainingFrequencies"
          :key="`${freq.pair[0]}-${freq.pair[1]}`"
          class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          @mouseenter="handlePairHover(freq.pair)"
          @mouseleave="handlePairHover(null)"
        >
          <!-- Token Pair Visualization -->
          <div class="flex items-center gap-0.5">
            <span
              class="inline-block px-2 py-0.5 text-xs font-mono rounded"
              :style="{ backgroundColor: getTokenColor(freq.pair[0]) }"
            >
              {{ displayTokenContent(freq.pair[0]) }}
            </span>
            <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
            <span
              class="inline-block px-2 py-0.5 text-xs font-mono rounded"
              :style="{ backgroundColor: getTokenColor(freq.pair[1]) }"
            >
              {{ displayTokenContent(freq.pair[1]) }}
            </span>
          </div>

          <!-- Frequency Count with Bar -->
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {{ freq.frequency }}×
            </span>
            <div class="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-primary-500 transition-all"
                :style="{ width: `${topFrequency ? Math.min(100, (freq.frequency / topFrequency.frequency) * 100) : 0}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </CollapsiblePanel>
</template>

<script lang="ts">
import { getTokenColor } from '../utils/tokenColor'
export { getTokenColor }
</script>
