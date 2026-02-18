<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from 'lucide-vue-next'

defineProps<{
  title: string
  collapsedContent?: string
}>()

const isExpanded = ref(true)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
    <!-- Header (always visible, clickable) -->
    <button
      @click="toggle"
      class="w-full px-4 py-3 flex items-center justify-between bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
    >
      <div class="flex-1 text-left">
        <h3 class="font-semibold text-slate-900 dark:text-slate-100">{{ title }}</h3>
        <p v-if="!isExpanded && collapsedContent" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ collapsedContent }}
        </p>
      </div>
      <ChevronDown
        :size="18"
        class="text-slate-500 dark:text-slate-400 transition-transform"
        :class="{ 'rotate-180': isExpanded }"
      />
    </button>

    <!-- Content (expandable) -->
    <Transition
      name="expand"
      @enter="(el: any) => el.style.height = '0'"
      @enter-active="(el: any) => el.style.height = el.scrollHeight + 'px'"
      @leave-active="(el: any) => el.style.height = '0'"
    >
      <div v-show="isExpanded" class="overflow-hidden transition-all duration-300">
        <div class="p-4">
          <slot />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.expand-enter-active,
.expand-leave-active {
  transition: height 0.3s ease;
  overflow: hidden;
}
</style>
