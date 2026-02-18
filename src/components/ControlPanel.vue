<script setup lang="ts">
import { SkipBack, Play, Pause, SkipForward } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'

const { canGoPrevious, canGoNext, isPlaying, previousStep, nextStep, play, pause } = useBPE()

const handlePlayPause = () => {
  if (isPlaying.value) {
    pause()
  } else {
    play()
  }
}
</script>

<template>
  <div class="border-t border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900">
    <div class="flex gap-2 justify-center">
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
    </div>
  </div>
</template>
