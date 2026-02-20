<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  criticalPadding?: boolean // Default true
}>()

const isExpanded = ref(true)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}

const shouldPad = props.criticalPadding !== false
</script>

<template>
  <!-- Header (always visible, clickable) - static height -->
  <button
    @click="toggle"
    class="panel-header w-full px-4 py-3 flex items-center justify-between bg-primary-600 dark:bg-primary-700 hover:bg-primary-500 dark:hover:bg-primary-600 transition-colors border-b border-slate-200 dark:border-slate-700"
    style="flex: 0 0 auto;"
  >
    <h3 class="font-semibold text-white">{{ title }}</h3>
    <ChevronDown
      :size="18"
      class="text-white transition-transform flex-shrink-0"
      :class="{ 'rotate-180': isExpanded }"
    />
  </button>

  <!-- Critical Info (always visible) - static height -->
  <div 
    class="panel-critical bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
    :class="{ 'px-4 py-3': shouldPad }"
    style="flex: 0 0 auto;"
  >
    <slot name="critical" />
  </div>

  <!-- Collapsible Details (scrollable) - dynamic height, shares space with other flex-1 elements -->
  <div
    v-if="isExpanded"
    class="panel-details bg-white dark:bg-slate-800 overflow-y-auto border-b border-slate-200 dark:border-slate-700"
    style="flex: 1 1 0; min-height: 0;"
  >
    <div class="p-4">
      <slot name="details" />
    </div>
  </div>
</template>
