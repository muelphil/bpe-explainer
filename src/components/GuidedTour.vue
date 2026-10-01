<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { ArrowLeft, ArrowRight, X } from 'lucide-vue-next'
import type { BPELesson } from '../data/bpeLesson'

const props = defineProps<{
  lesson: BPELesson | null
  current: number
  total: number
}>()

const emit = defineEmits<{
  next: []
  previous: []
  exit: []
}>()

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') emit('exit')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <aside
    v-if="lesson"
    class="fixed bottom-6 left-1/2 z-50 w-[min(440px,calc(100vw-48px))] -translate-x-1/2 rounded-xl border border-primary-200 bg-white p-4 shadow-2xl dark:border-primary-800 dark:bg-slate-900"
    aria-live="polite"
    aria-label="Guided BPE walkthrough"
  >
    <div class="mb-3 flex items-start justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-primary-600 dark:text-primary-400">
          Guided walkthrough · {{ current }} of {{ total }}
        </p>
        <h2 class="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">{{ lesson.title }}</h2>
      </div>
      <button
        class="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
        aria-label="Exit guided walkthrough"
        @click="emit('exit')"
      >
        <X :size="18" />
      </button>
    </div>
    <p class="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{{ lesson.description }}</p>
    <p v-if="lesson.action" class="mt-2 text-sm font-medium text-primary-700 dark:text-primary-300">{{ lesson.action }}</p>
    <div class="mt-4 flex items-center justify-between">
      <button
        class="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 dark:text-slate-300 dark:hover:bg-slate-800"
        :disabled="current === 1"
        @click="emit('previous')"
      >
        <ArrowLeft :size="15" />
        Back
      </button>
      <button
        class="inline-flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-500"
        @click="emit('next')"
      >
        {{ current === total ? 'Explore freely' : 'Next' }}
        <ArrowRight :size="15" />
      </button>
    </div>
  </aside>
</template>
