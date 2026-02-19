<script setup lang="ts">
import {ref, computed} from 'vue'
import {Settings} from 'lucide-vue-next'
import {useBPE} from '../composables/useBPE'
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
}>()

const emit = defineEmits<{
  openSettings: []
  hoverPair: [pair: [string, string] | null]
  hoverToken: [content: string | null]
  goToStep: [stepNumber: number]
  modeChange: [mode: { showSidebars: boolean, showControlPanel: boolean }]
}>()

type ViewMode = 'training-data' | 'training' | 'validation'

const {initialize, state} = useBPE()

const currentMode = ref<ViewMode>('training-data')
const isTrainingDataDefined = ref(false)
const trainingDataViewRef = ref<InstanceType<typeof TrainingDataView> | null>(null)

const handleStartTraining = (trainingData: string) => {
  initialize(trainingData)
  isTrainingDataDefined.value = true
  currentMode.value = 'training'
  emit('modeChange', {showSidebars: true, showControlPanel: true})
}

const switchToMode = (mode: ViewMode) => {
  if (mode === 'training-data') {
    // Going back to training data resets everything
    currentMode.value = mode
    emit('modeChange', {showSidebars: false, showControlPanel: false})
  } else if (mode === 'training' && isTrainingDataDefined.value) {
    currentMode.value = mode
    emit('modeChange', {showSidebars: true, showControlPanel: true})
  } else if (mode === 'training' && !isTrainingDataDefined.value && currentMode.value === 'training-data') {
    // If clicking Training button while in training-data mode, trigger start training
    if (trainingDataViewRef.value) {
      trainingDataViewRef.value.triggerStartTraining()
    }
  } else if (mode === 'validation' && isTrainingDataDefined.value) {
    currentMode.value = mode
    emit('modeChange', {showSidebars: true, showControlPanel: false})
  }
}

const isButtonEnabled = (mode: ViewMode) => {
  if (mode === 'training-data') return true
  if (mode === 'training') return true // Always enabled - triggers start training if needed
  return isTrainingDataDefined.value
}

// Emit mode change on mount
import {onMounted} from 'vue'

onMounted(() => {
  emit('modeChange', {showSidebars: false, showControlPanel: false})
})

const showControlPanel = computed(() => {
  return currentMode.value === 'training'
})

</script>

<template>
  <div class="h-full w-full flex flex-col">
    <!-- Header with title and mode buttons -->
    <div class="px-6 py-4 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
        Byte-Pair Encoding Visualizer
      </h1>

      <!-- Mode Navigation and Settings Buttons -->
      <div class="flex gap-2">
        <button
          @click="switchToMode('training-data')"
          :disabled="!isButtonEnabled('training-data')"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            currentMode === 'training-data'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600',
            !isButtonEnabled('training-data') && 'opacity-50 cursor-not-allowed'
          ]"
        >
          Training Data
        </button>
        <button
          @click="switchToMode('training')"
          :disabled="!isButtonEnabled('training')"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            currentMode === 'training'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600',
            !isButtonEnabled('training') && 'opacity-50 cursor-not-allowed'
          ]"
        >
          Training
        </button>
        <button
          @click="switchToMode('validation')"
          :disabled="!isButtonEnabled('validation')"
          :class="[
            'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
            currentMode === 'validation'
              ? 'bg-primary-500 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600',
            !isButtonEnabled('validation') && 'opacity-50 cursor-not-allowed'
          ]"
        >
          Validation
        </button>
        <button
          @click="emit('openSettings')"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-all bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 flex items-center gap-2"
          title="Settings"
        >
          <Settings :size="16"/>
        </button>
      </div>
    </div>

    <!-- Main Content -->
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
</template>


