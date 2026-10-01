<script setup lang="ts">
import {computed} from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import {useBPE} from '../composables/useBPE'
import {displayTokenContent, getTokenColor} from '../utils/tokenColor'
import AppTooltip from './AppTooltip.vue'

const props = defineProps<{
  hoveredPair: [string, string] | null
  initialExpanded?: boolean
}>()

const emit = defineEmits<{
  hoverPair: [pair: [string, string] | null]
  expandedChange: [expanded: boolean]
}>()

const {frequencies} = useBPE()

const topFrequency = computed(() => frequencies.value[0] || null)
const remainingFrequencies = computed(() => frequencies.value.slice(1))

const handlePairHover = (pair: [string, string] | null) => {
  emit('hoverPair', pair)
}

const isPairHighlighted = (pair: [string, string], hoveredPair: [string, string] | null): boolean => {
  return hoveredPair !== null && pair[0] === hoveredPair[0] && pair[1] === hoveredPair[1]
}
</script>

<template>
  <CollapsiblePanel title="Frequency of Pairs" :initialExpanded="props.initialExpanded" @change="(v) => emit('expandedChange', v)">
    <!-- Critical Info (always visible) - First item of list -->
    <template #critical>
      <div class="mb-1 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Adjacent pair occurrences</span>
        <AppTooltip text="Hover a pair to reveal every occurrence in the corpus. The leading pair is BPE’s next candidate.">
          <span tabindex="0" class="cursor-help underline decoration-dotted">How it works</span>
        </AppTooltip>
      </div>
      <div v-if="!topFrequency" class="text-sm text-slate-500 dark:text-slate-400 p-2">
        No pairs available
      </div>
      <div
        v-else
        class="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
        @mouseenter="handlePairHover(topFrequency.pair)"
        @mouseleave="handlePairHover(null)"
      >
        <!-- Token Pair Visualization using unified token classes -->
        <div style="display:flex; gap: 2px; align-items: anchor-center;">
          <span
            class="token"
            :style="{ backgroundColor: getTokenColor(topFrequency.pair[0]) }"
          >{{ displayTokenContent(topFrequency.pair[0]) }}</span>
          <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
          <span
            class="token"
            :style="{ backgroundColor: getTokenColor(topFrequency.pair[1]) }"
          >{{ displayTokenContent(topFrequency.pair[1]) }}</span>
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
    <template #details v-if="topFrequency">
      <div class="-m-3">
        <div
          v-for="(freq, index) in remainingFrequencies"
          :key="`${freq.pair[0]}-${freq.pair[1]}`"
          class="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors cursor-pointer"
          @mouseenter="handlePairHover(freq.pair)"
          @mouseleave="handlePairHover(null)"
        >
          <!-- Token Pair Visualization using unified token classes -->
          <div style="display:flex; gap: 2px; align-items: anchor-center;">
              <span
                class="token"
                :style="{ backgroundColor: getTokenColor(freq.pair[0]) }"
              >{{ displayTokenContent(freq.pair[0]) }}</span>
            <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
            <span
              class="token"
              :style="{ backgroundColor: getTokenColor(freq.pair[1]) }"
            >{{ displayTokenContent(freq.pair[1]) }}
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
