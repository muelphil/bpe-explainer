<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { ChevronDown, Check, Circle } from 'lucide-vue-next'
import { useBPE } from '../composables/useBPE'
import { displayTokenContent, getTokenColor } from '../utils/tokenColor'

const emit = defineEmits<{
  goToStep: [stepNumber: number]
}>()

const { steps, currentStep, currentStepData } = useBPE()

const stepsContainerRef = ref<HTMLDivElement | null>(null)
const isExpanded = ref(true)

const toggle = () => {
  isExpanded.value = !isExpanded.value
}

const handleStepClick = (stepNumber: number) => {
  emit('goToStep', stepNumber)
}

const getStepIcon = (stepNumber: number) => {
  if (stepNumber < currentStep.value) return 'completed'
  if (stepNumber === currentStep.value) return 'current'
  return 'pending'
}

const getStepTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    tokenize: 'Initialize',
    select: 'Select most frequent pair',
    merge: 'Merge',
    complete: 'Complete'
  }
  return labels[type] || type
}

// Auto-scroll current step to top
watch([currentStep, isExpanded], async () => {
  await nextTick()
  if (stepsContainerRef.value) {
    const currentStepElement = stepsContainerRef.value.querySelector(`[data-step="${currentStep.value}"]`)
    if (currentStepElement) {
      currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
})
</script>

<template>
  <!-- Header (always visible, clickable) - static height -->
  <button
    @click="toggle"
    class="panel-header w-full px-4 py-3 flex items-center justify-between bg-primary-600 dark:bg-primary-700 hover:bg-primary-500 dark:hover:bg-primary-600 transition-colors border-b border-slate-200 dark:border-slate-700"
    style="flex: 0 0 auto;"
  >
    <h3 class="font-semibold text-white">Steps</h3>
    <ChevronDown
      :size="18"
      class="text-white transition-transform flex-shrink-0"
      :class="{ 'rotate-180': isExpanded }"
    />
  </button>

  <!-- Steps List - All steps with fixed height -->
  <div
    ref="stepsContainerRef"
    class="steps-container bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
    :style="{
      flex: isExpanded ? '1 1 0' : '0 0 auto',
      minHeight: '0',
      height: isExpanded ? 'auto' : '78px',
      overflowY: isExpanded ? 'auto' : 'hidden'
    }"
  >
    <button
      v-for="step in steps"
      :key="step.stepNumber"
      :data-step="step.stepNumber"
      @click="handleStepClick(step.stepNumber)"
      class="w-full text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700 last:border-b-0"
      :class="{
        'bg-primary-50 dark:bg-primary-900/20': step.stepNumber === currentStep
      }"
      style="height: 78px; flex-shrink: 0;"
    >
      <div class="flex items-start gap-3 py-3 px-3 h-full">
        <!-- Step Icon -->
        <div class="flex-shrink-0" style="align-self: center;">
          <div
            v-if="getStepIcon(step.stepNumber) === 'completed'"
            class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
          >
            <Check :size="12" class="text-white" />
          </div>
          <div
            v-else-if="getStepIcon(step.stepNumber) === 'current'"
            class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center"
          >
            <Circle :size="8" class="text-white fill-white" />
          </div>
          <div
            v-else
            class="w-5 h-5 rounded-full border-2 border-slate-300 dark:border-slate-600"
          ></div>
        </div>

        <!-- Step Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span
              class="px-2 py-0.5 text-xs font-medium rounded"
              :class="{
                'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300': step.type === 'tokenize',
                'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': step.type === 'select',
                'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': step.type === 'merge',
                'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300': step.type === 'complete'
              }"
            >
              {{ getStepTypeLabel(step.type) }}
            </span>
            <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">
              #{{ step.stepNumber }}
            </span>
          </div>

          <!-- Token Visualization for Select and Merge steps -->
          <div v-if="step.type === 'select' && step.selectedPair" class="mb-1">
            <div style="display:flex; gap: 2px; align-items: center;">
              <span
                class="token small no-id"
                :style="step.selectedPair[0] ? { backgroundColor: getTokenColor(step.selectedPair[0]) } : {}"
              >{{ displayTokenContent(step.selectedPair[0]) }}</span>
              <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
              <span
                class="token small no-id"
                :style="step.selectedPair[1] ? { backgroundColor: getTokenColor(step.selectedPair[1]) } : {}"
              >{{ displayTokenContent(step.selectedPair[1]) }}</span>
            </div>
          </div>

          <div v-else-if="step.type === 'merge' && step.selectedPair && step.addedToken" class="mb-1">
            <div style="display:flex; gap: 4px; align-items: center;">
              <span
                class="token small no-id"
                :style="step.selectedPair[0] ? { backgroundColor: getTokenColor(step.selectedPair[0]) } : {}"
              >{{ displayTokenContent(step.selectedPair[0]) }}</span>
              <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
              <span
                class="token small no-id"
                :style="step.selectedPair[1] ? { backgroundColor: getTokenColor(step.selectedPair[1]) } : {}"
              >{{ displayTokenContent(step.selectedPair[1]) }}</span>
              <span class="text-slate-400 dark:text-slate-500 text-xs">→</span>
              <span
                class="token small no-id"
                :style="step.addedToken.color ? { backgroundColor: step.addedToken.color } : {}"
              >{{ displayTokenContent(step.addedToken.content) }}</span>
            </div>
          </div>

          <p v-else class="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
            {{ step.description }}
          </p>
        </div>

        <!-- Token Count Badge -->
        <div class="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 font-mono">
          {{ step.tokenCount }}t
        </div>
      </div>
    </button>
  </div>
</template>

