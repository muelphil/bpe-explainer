<script setup lang="ts">
import { computed } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent } from '../utils/tokenColor'

const emit = defineEmits<{
  hoverPair: [pair: [string, string] | null]
}>()

const { frequencies } = useBPE()

const collapsedContent = computed(() => {
  if (frequencies.value.length === 0) return 'No pairs available'
  const top = frequencies.value[0]
  if (!top) return 'No pairs available'
  return `"${displayTokenContent(top.pair[0])}" + "${displayTokenContent(top.pair[1])}" (${top.frequency}×)`
})

const handlePairHover = (pair: [string, string] | null) => {
  emit('hoverPair', pair)
}
</script>

<template>
  <CollapsiblePanel title="Frequency" :collapsedContent="collapsedContent">
    <div v-if="frequencies.length === 0" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
      No token pairs available
    </div>
    
    <div v-else class="space-y-2">
      <div
        v-for="(freq, index) in frequencies"
        :key="`${freq.pair[0]}-${freq.pair[1]}`"
        class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer group"
        @mouseenter="handlePairHover(freq.pair)"
        @mouseleave="handlePairHover(null)"
      >
        <!-- Token Pair Visualization -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-slate-400 dark:text-slate-500 font-mono w-4">
            {{ index + 1 }}
          </span>
          <div class="flex items-center gap-0.5">
            <span
              class="inline-block px-2 py-0.5 text-xs font-mono rounded"
              :style="{ backgroundColor: freq.pair[0] ? getTokenColor(freq.pair[0]) : '#ccc' }"
            >
              {{ displayTokenContent(freq.pair[0]) }}
            </span>
            <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
            <span
              class="inline-block px-2 py-0.5 text-xs font-mono rounded"
              :style="{ backgroundColor: freq.pair[1] ? getTokenColor(freq.pair[1]) : '#ccc' }"
            >
              {{ displayTokenContent(freq.pair[1]) }}
            </span>
          </div>
        </div>

        <!-- Frequency Count -->
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {{ freq.frequency }}×
          </span>
          <div class="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-primary-500 transition-all"
              :style="{ width: `${frequencies[0] ? Math.min(100, (freq.frequency / frequencies[0].frequency) * 100) : 0}%` }"
            ></div>
          </div>
        </div>
      </div>
    </div>
  </CollapsiblePanel>
</template>

<script lang="ts">
import { getTokenColor } from '../utils/tokenColor'
export { getTokenColor }
</script>
