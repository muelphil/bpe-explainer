<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Info } from 'lucide-vue-next'
import ButtonGroup from './ButtonGroup.vue'
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

// Preset type
type PresetType = 'compression' | 'byteLevelBPE'

// Apply preset
const applyPreset = (preset: PresetType) => {
  if (preset === 'compression') {
    localSettings.value.initialVocab = 'presentChars'
    localSettings.value.breakCondition = 'noFrequentPairs'
    localSettings.value.mergingRestriction = 'none'
  } else {
    localSettings.value.initialVocab = 'bytes'
    localSettings.value.breakCondition = 'maxVocabSize'
    localSettings.value.mergingRestriction = 'llm'
  }
}

// Watch for settings prop changes
watch(() => props.settings, (newSettings) => {
  localSettings.value = { ...newSettings }
}, { deep: true })

// Initialize preset on mount
// (no preset detection needed - presets are just action buttons)

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
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden" style="display: flex;flex-direction: column;">
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
            <!-- Preset Selection -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Presets
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-72 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    Compression BPE (1994) was designed for text compression. Byte-Level BPE uses modern adjustments for building vocabularies for large language models based on training data.
                  </span>
                </button>
              </div>
              <div class="flex gap-3">
                <button
                  @click="applyPreset('byteLevelBPE')"
                  class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  Byte-Level BPE
                </button>
                <button
                  @click="applyPreset('compression')"
                  class="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors"
                >
                  Compression BPE
                </button>
              </div>
            </div>

            <!-- Initial Vocabulary -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Initial Vocabulary
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                      Present Chars uses only the unique characters from your training data. Bytes starts with all 256 byte values as the initial vocabulary.
                  </span>
                </button>
              </div>
              <ButtonGroup
                v-model="localSettings.initialVocab"
                :options="[
                  { value: 'bytes', label: 'Bytes' },
                  { value: 'presentChars', label: 'Present Chars' },
                ]"
              />
            </div>

            <!-- Merging Restrictions -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Merge Rules
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    LLM rules keep letters, numbers, and symbols separate, mimicking modern tokenizers. No restrictions allows any adjacent tokens to merge.
                  </span>
                </button>
              </div>
              <ButtonGroup
                v-model="localSettings.mergingRestriction"
                :options="[
                  { value: 'llm', label: 'LLM Rules' },
                  { value: 'none', label: 'No Restrictions' }
                ]"
              />
            </div>

            <!-- Stop Condition -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Stop Condition
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    Maximum vocabulary size stops when reaching a target number of tokens. No frequent pairs stops when all pairs occur only once.
                  </span>
                </button>
              </div>
              <ButtonGroup
                v-model="localSettings.breakCondition"
                :options="[
                  { value: 'maxVocabSize', label: 'Max Vocab Size' },
                  { value: 'noFrequentPairs', label: 'No Frequent Pairs' },
                  { value: 'compression', label: 'Compression' }
                ]"
              />
            </div>

            <!-- Max Vocab Size -->
            <div v-if="localSettings.breakCondition === 'maxVocabSize'" class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Max Vocab Size
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    The algorithm stops when the vocabulary reaches this size. Common values: 256 (tiny), 1000 (small), 50000 (GPT-like).
                  </span>
                </button>
              </div>
              <input
                v-model.number="localSettings.maxVocabSize"
                type="number"
                min="10"
                max="10000"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Target Compression Rate -->
            <div v-if="localSettings.breakCondition === 'compression'" class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Target Compression Rate (%)
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    The algorithm stops when the compression percentage reaches this value. 50% means the token count is halved compared to the initial tokenization.
                  </span>
                </button>
              </div>
              <input
                v-model.number="localSettings.targetCompressionRate"
                type="number"
                min="1"
                max="99"
                class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <!-- Divider -->
            <div class="border-t border-slate-200 dark:border-slate-700 my-6"></div>

            <!-- Play Speed -->
            <div class="space-y-3">
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-slate-900 dark:text-slate-100">
                  Step Speed: {{ localSettings.playSpeed }}ms
                </label>
                <button
                  class="group relative"
                  @mouseenter="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.remove('opacity-0')"
                  @mouseleave="$event => ($event.currentTarget as HTMLElement).querySelector('.tooltip')?.classList.add('opacity-0')"
                >
                  <Info :size="16" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
                  <span class="tooltip absolute right-0 top-6 w-64 p-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded opacity-0 transition-opacity pointer-events-none z-10">
                    Controls how fast steps advance when using the play button. Lower values are faster.
                  </span>
                </button>
              </div>
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

            <!-- Guided Tour Spotlight -->
            <div class="space-y-3">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">Guided Tour Spotlight <span class="block text-xs font-normal text-slate-500 dark:text-slate-400">Dims everything except the token view and the explained element (desktop only)</span></span>
                <div class="relative">
                  <input
                    v-model="localSettings.tourSpotlight"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </div>
              </label>
            </div>

            <!-- Guided Tour Pulse -->
            <div class="space-y-3">
              <label class="flex items-center justify-between cursor-pointer">
                <span class="text-sm font-medium text-slate-900 dark:text-slate-100">Guided Tour Pulse Highlight</span>
                <div class="relative">
                  <input
                    v-model="localSettings.tourPulse"
                    type="checkbox"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-primary-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                </div>
              </label>
            </div>

            <!-- Dark Mode -->
            <div class="space-y-3">
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
          <div class="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900" style="flex: 0 0 auto;">
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
