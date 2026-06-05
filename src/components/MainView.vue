<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted} from 'vue'
import {Settings, ChevronDown} from 'lucide-vue-next'
import {useBPE} from '../composables/useBPE'
import {useIsMobile} from '../composables/useIsMobile'
import TrainingDataView from './TrainingDataView.vue'
import TrainingView from './TrainingView.vue'
import ValidationView from './ValidationView.vue'
import FrequencyPanel from './FrequencyPanel.vue'
import VocabularyPanel from './VocabularyPanel.vue'
import StepPanel from './StepPanel.vue'
import ControlPanel from './ControlPanel.vue'

defineProps<{
  hoveredPair: [string, string] | null
  hoveredTokenContent: string | null
  effectiveHoveredPair: [string, string] | null
  effectiveHoveredTokenContent: string | null
  mobileContentHidden?: boolean
}>()

const emit = defineEmits<{
  openSettings: []
  hoverPair: [pair: [string, string] | null]
  hoverToken: [content: string | null]
  goToStep: [stepNumber: number]
  modeChange: [mode: { showSidebars: boolean, showControlPanel: boolean, showFrequencySteps: boolean }]
}>()

type ViewMode = 'training-data' | 'training' | 'validation'

const modeLabels: Record<ViewMode, string> = {
  'training-data': 'Training Data',
  'training': 'Training',
  'validation': 'Validation',
}

const {initialize, state} = useBPE()
const { isMobile } = useIsMobile()

const currentMode = ref<ViewMode>('training')
const isTrainingDataDefined = ref(true)
const trainingDataViewRef = ref<InstanceType<typeof TrainingDataView> | null>(null)
const isDropdownOpen = ref(false)
const dropdownRef = ref<HTMLDivElement | null>(null)

const handleStartTraining = (trainingData: string) => {
  initialize(trainingData)
  isTrainingDataDefined.value = true
  currentMode.value = 'training'
  emit('modeChange', {showSidebars: true, showControlPanel: true, showFrequencySteps: true})
}

const switchToMode = (mode: ViewMode) => {
  if (mode === 'training-data') {
    currentMode.value = mode
    emit('modeChange', {showSidebars: false, showControlPanel: false, showFrequencySteps: false})
  } else if (mode === 'training' && isTrainingDataDefined.value) {
    currentMode.value = mode
    emit('modeChange', {showSidebars: true, showControlPanel: true, showFrequencySteps: true})
  } else if (mode === 'training' && !isTrainingDataDefined.value && currentMode.value === 'training-data') {
    if (trainingDataViewRef.value) {
      trainingDataViewRef.value.triggerStartTraining()
    }
  } else if (mode === 'validation' && isTrainingDataDefined.value) {
    currentMode.value = mode
    emit('modeChange', {showSidebars: true, showControlPanel: false, showFrequencySteps: false})
  }
}

const handleMobileModeSelect = (mode: ViewMode) => {
  switchToMode(mode)
  isDropdownOpen.value = false
}

const isButtonEnabled = (mode: ViewMode) => {
  if (mode === 'training-data') return true
  if (mode === 'training') return true
  return isTrainingDataDefined.value
}

const modes = ['training-data', 'training', 'validation'] as const satisfies readonly ViewMode[]

const getModeClass = (mode: ViewMode, variant: 'button' | 'dropdown') => {
  if (currentMode.value === mode) return 'bg-primary-500 text-white'
  if (!isButtonEnabled(mode)) {
    const base = variant === 'dropdown' ? 'bg-white dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'
    return `${base} text-slate-400 dark:text-slate-600 cursor-not-allowed`
  }
  if (variant === 'dropdown') {
    return 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
  }
  return 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
}


const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    isDropdownOpen.value = false
  }
}

onMounted(() => {
  emit('modeChange', {showSidebars: true, showControlPanel: true, showFrequencySteps: true})
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const showControlPanel = computed(() => {
  return currentMode.value === 'training'
})

</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header with title and mode buttons -->
    <div class="px-6 py-4 flex items-center justify-between gap-4">
      <div class="header-gradient">
        <h1 class="header-title">
            <span v-if="isMobile">BPE Explainer</span>
            <span v-else>Byte-Pair Encoding Explainer</span>
          </h1>
      </div>

      <!-- Mode Navigation and Settings Buttons -->
      <div class="flex gap-2 flex-shrink-0 items-center">

        <!-- Desktop: mode buttons via v-for -->
        <button
          v-for="mode in modes"
          :key="mode"
          :class="[isMobile ? 'hidden' : 'block', 'px-4 py-1.5 rounded-md text-sm font-medium transition-all', getModeClass(mode, 'button')]"
          @click="switchToMode(mode)"
          :disabled="!isButtonEnabled(mode)"
        >
          {{ modeLabels[mode] }}
        </button>

        <!-- Mobile: dropdown -->
        <div ref="dropdownRef" class="relative" :class="isMobile ? 'block' : 'hidden'">
          <button
            @click.stop="isDropdownOpen = !isDropdownOpen"
            class="px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 bg-primary-500 text-white"
          >
            {{ modeLabels[currentMode] }}
            <ChevronDown :size="14" class="transition-transform" :class="{ 'rotate-180': isDropdownOpen }" />
          </button>

          <!-- Dropdown menu -->
          <div
            v-if="isDropdownOpen"
            class="absolute right-0 top-full mt-1 z-50 flex flex-col rounded-md overflow-hidden shadow-lg border border-slate-200 dark:border-slate-600"
          >
            <button
              v-for="mode in modes"
              :key="mode"
              @click.stop="handleMobileModeSelect(mode)"
              :disabled="!isButtonEnabled(mode)"
              class="px-4 py-2 text-sm font-medium text-left transition-colors whitespace-nowrap"
              :class="getModeClass(mode, 'dropdown')"
            >
              {{ modeLabels[mode] }}
            </button>
          </div>
        </div>

        <button
          @click="emit('openSettings')"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2"
          style="height: stretch;"
          title="Settings"
        >
          <Settings :size="16"/>
        </button>
      </div>
    </div>

    <!-- Content row: left panel (blog) + training/validation view + sidebar (side-by-side on desktop) -->
    <div class="flex-1 flex overflow-hidden min-h-0 relative" :class="isMobile ? 'flex-col' : 'flex-row'">

      <!-- Left panel slot (blog article, mobile overlay) -->
      <slot name="leftPanel" />

      <!-- Training / Validation content -->
      <div v-show="!mobileContentHidden" class="flex-1 overflow-hidden flex flex-col min-h-0">
        <TrainingDataView
          v-if="currentMode === 'training-data'"
          ref="trainingDataViewRef"
          @startTraining="handleStartTraining"
          class="flex-1 overflow-hidden"
        />
        <TrainingView
          v-else-if="currentMode === 'training'"
          :hoveredPair="effectiveHoveredPair"
          :hoveredTokenContent="effectiveHoveredTokenContent"
          class="flex-1 overflow-hidden"
        />
        <ValidationView
          v-else-if="currentMode === 'validation'"
          class="flex-1 overflow-hidden"
        />
      </div>

      <!-- Sidebar slot (panels on desktop right, panels below on mobile) -->
      <slot name="sidebar" />

    </div>
  </div>
</template>

<style scoped>
.header-gradient {
  background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
  padding: 4px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.dark .header-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%);
}

.header-link {
  font-family: 'Jersey 15', cursive;
  font-size: 0.875rem;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.header-link:hover {
  color: rgba(255, 255, 255, 0.95);
}

.header-title {
  font-family: 'Jersey 15', cursive;
  font-size: 1.35rem;
  font-weight: 400;
  color: white;
  margin: 0;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}
</style>

