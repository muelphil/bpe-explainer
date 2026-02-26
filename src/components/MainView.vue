<script setup lang="ts">
import {ref, computed} from 'vue'
import {Settings} from 'lucide-vue-next'
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
  modeChange: [mode: { showSidebars: boolean, showControlPanel: boolean }]
}>()

type ViewMode = 'training-data' | 'training' | 'validation'

const {initialize, state} = useBPE()
const { isMobile } = useIsMobile()

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
    <div class="px-6 py-4 flex items-center justify-between gap-4">
      <div class="header-gradient">
        <h1 class="header-title">
            <span class="sm:hidden">BPE</span>
            <span class="hidden sm:inline">Byte-Pair Encoding Visualizer</span>
          </h1>
      </div>

      <!-- Mode Navigation and Settings Buttons -->
      <div class="flex gap-2 flex-shrink-0">
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
    <div v-show="!mobileContentHidden" class="flex-1 overflow-hidden flex flex-col">
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

