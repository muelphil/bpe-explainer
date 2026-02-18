<script setup lang="ts">
import { ref, watch } from 'vue'
import { X } from 'lucide-vue-next'
import type { BPESettings } from '../services/types'

const props = defineProps<{
  isOpen: boolean
  settings: BPESettings
}>()

const emit = defineEmits<{
  close: []
  save: [settings: BPESettings]
}>()

// Local state for form
const localSettings = ref<BPESettings>({ ...props.settings })

// Watch for settings prop changes
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

const handleSave = () => {
  emit('save', { ...localSettings.value })
  emit('close')
}

const handleCancel = () => {
  localSettings.value = { ...props.settings }
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 class="text-xl font-semibold text-slate-900 dark:text-slate-100">Settings</h2>
            <button
              @click="handleCancel"
              class="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X :size="20" class="text-slate-500 dark:text-slate-400" />
            </button>
          </div>

          <!-- Content -->
          <div class="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <!-- Initial Vocabulary -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Initial Vocabulary
              </label>
              <div class="space-y-2">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    v-model="localSettings.initialVocab"
                    type="radio"
                    value="characters"
                    class="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    Characters from training data
                  </span>
                </label>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    v-model="localSettings.initialVocab"
                    type="radio"
                    value="bytes"
                    class="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    All 256 bytes
                  </span>
                </label>
              </div>
            </div>

            <!-- Break Condition -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Stop Condition
              </label>
              <div class="space-y-2">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    v-model="localSettings.breakCondition"
                    type="radio"
                    value="maxVocabSize"
                    class="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    Maximum vocabulary size
                  </span>
                </label>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    v-model="localSettings.breakCondition"
                    type="radio"
                    value="noFrequentPairs"
                    class="w-4 h-4 text-primary-500 focus:ring-primary-500"
                  />
                  <span class="text-sm text-slate-700 dark:text-slate-300">
                    No frequent pairs (frequency = 1)
                  </span>
                </label>
              </div>
            </div>

            <!-- Max Vocab Size -->
            <div v-if="localSettings.breakCondition === 'maxVocabSize'" class="space-y-2">
              <label class="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Max Vocabulary Size
              </label>
              <input
                v-model.number="localSettings.maxVocabSize"
                type="number"
                min="10"
                max="10000"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p class="text-xs text-slate-500">Common values: 256 (small), 1000 (medium), 50000 (GPT-like)</p>
            </div>

            <!-- Play Speed -->
            <div class="space-y-2">
              <label class="block text-sm font-medium text-slate-900 dark:text-slate-100">
                Play Speed: {{ localSettings.playSpeed }}ms
              </label>
              <input
                v-model.number="localSettings.playSpeed"
                type="range"
                min="100"
                max="3000"
                step="100"
                class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div class="flex justify-between text-xs text-slate-500">
                <span>Fast (100ms)</span>
                <span>Slow (3000ms)</span>
              </div>
            </div>

            <!-- Dark Mode -->
            <div class="space-y-2">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">Dark Mode</span>
                <div class="relative">
                  <input
                    v-model="localSettings.darkMode"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </div>
              </label>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
            <button
              @click="handleCancel"
              class="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              @click="handleSave"
              class="flex-1 px-4 py-2 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div,
.modal-leave-active > div {
  transition: transform 0.2s ease;
}

.modal-enter-from > div,
.modal-leave-to > div {
  transform: scale(0.95);
}
</style>
