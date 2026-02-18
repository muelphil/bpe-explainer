<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  title: string
}>()

const isExpanded = ref(true)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="flex flex-col overflow-hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
    <!-- Header (always visible, clickable) - Distinct color -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex items-center justify-between bg-primary-600 dark:bg-primary-700 hover:bg-primary-500 dark:hover:bg-primary-600 transition-colors flex-shrink-0"
    >
      <h3 class="font-semibold text-white">{{ title }}</h3>
      <ChevronDown
        :size="18"
        class="text-white transition-transform flex-shrink-0"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Critical Info (always visible, not collapsible) -->
    <div class="px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
      <slot name="critical" />
    </div>

    <!-- Collapsible Details -->
    <div
      v-show="isExpanded"
      class="flex-1 overflow-y-auto"
    >
      <div class="p-4">
        <slot name="details" />
      </div>
    </div>
  </div>
</template>
