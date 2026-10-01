<script setup lang="ts">
import { BookOpenCheck, RotateCcw, Sparkles } from 'lucide-vue-next'

defineProps<{
  isSyncEnabled: boolean
  status: string
}>()

const emit = defineEmits<{
  startTour: []
  toggleSync: []
  resetLesson: []
}>()
</script>

<template>
  <div class="flex items-center gap-2 rounded-lg border border-primary-100 bg-primary-50/70 px-2 py-1.5 dark:border-primary-900/70 dark:bg-primary-950/30">
    <button
      class="inline-flex items-center gap-1.5 rounded-md bg-primary-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-500"
      @click="emit('startTour')"
    >
      <Sparkles :size="14" />
      Guided tour
    </button>
    <button
      class="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary-800 transition hover:bg-primary-100 dark:text-primary-200 dark:hover:bg-primary-900/50"
      :aria-pressed="isSyncEnabled"
      @click="emit('toggleSync')"
    >
      <BookOpenCheck :size="14" />
      <span>{{ isSyncEnabled ? 'Reading sync on' : 'Sync while reading' }}</span>
    </button>
    <button
      class="rounded-md p-1.5 text-primary-700 transition hover:bg-primary-100 dark:text-primary-300 dark:hover:bg-primary-900/50"
      title="Return to the Text example"
      aria-label="Return to the Text example"
      @click="emit('resetLesson')"
    >
      <RotateCcw :size="14" />
    </button>
    <span class="hidden border-l border-primary-200 pl-2 text-xs text-primary-700 lg:inline dark:border-primary-800 dark:text-primary-300">
      {{ status }}
    </span>
  </div>
</template>
