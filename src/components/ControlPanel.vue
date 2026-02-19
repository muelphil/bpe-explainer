<script setup lang="ts">
import { SkipBack, Play, Pause, SkipForward, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'

const { canGoPrevious, canGoNext, isPlaying, previousStep, nextStep, play, pause, goToStep, steps, currentStep } = useBPE()

const handlePlayPause = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}

const goToStart = () => {
  goToStep(0)
}

const goToEnd = () => {
  if (steps.value.length > 0) {
    goToStep(steps.value.length - 1)
  }
}
</script>

<template>
  <div class="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
    <div class="p-4">
      <div class="flex gap-2 justify-between mb-3">
        <button
          @click="goToStart"
          :disabled="!canGoPrevious"
          class="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          title="Go to Start"
        >
          <ChevronsLeft :size="20" />
        </button>

        <button
          @click="previousStep"
          :disabled="!canGoPrevious"
          class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          title="Previous Step"
        >
          <SkipBack :size="20" />
        </button>

        <button
          @click="handlePlayPause"
          :disabled="!canGoNext && !isPlaying"
          class="px-6 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          :title="isPlaying ? 'Pause' : 'Play'"
        >
          <Pause v-if="isPlaying" :size="20" />
          <Play v-else :size="20" class="ml-0.5" />
          <span class="font-medium">{{ isPlaying ? 'Pause' : 'Play' }}</span>
        </button>

        <button
          @click="nextStep"
          :disabled="!canGoNext"
          class="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          title="Next Step"
        >
          <SkipForward :size="20" />
        </button>

        <button
          @click="goToEnd"
          :disabled="!canGoNext"
          class="px-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
          title="Go to End"
        >
          <ChevronsRight :size="20" />
        </button>
      </div>

      <!-- Progress Indicator -->
      <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
          :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>
