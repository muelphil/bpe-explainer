<script setup lang="ts">
import { useSlots } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

const props = defineProps<{
  title: string
  criticalPadding?: boolean // Default true
  tourId?: string // Sets data-tour on all root elements (component renders a fragment)
}>()

const isExpanded = defineModel<boolean>('expanded', { default: true })

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
const detailsSlotExists = () => !!slots.details

const slots = useSlots()
const shouldPad = props.criticalPadding !== false
</script>

<template>
  <!-- Header (always visible, clickable) - static height -->
  <button
    @click="toggle"
    :data-tour="tourId"
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
    :data-tour="tourId"
    class="panel-critical bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
    :class="{ 'p-3': shouldPad }"
    style="flex: 0 0 auto;"
  >
    <slot name="critical" />
  </div>

  <!-- Collapsible Details (scrollable) - dynamic height, shares space with other flex-1 elements -->
  <div
    v-if="isExpanded && detailsSlotExists()"
    :data-tour="tourId"
    class="panel-details bg-white dark:bg-slate-800 overflow-y-auto border-b border-slate-200 dark:border-slate-700"
    style="flex: 1 1 0; min-height: 0; overflow-x:hidden;"
  >
    <div class="p-3">
      <slot name="details" />
    </div>
  </div>
</template>
