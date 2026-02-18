<script setup lang="ts">
import { computed } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { Check, Circle } from 'lucide-vue-next'

const emit = defineEmits<{
  goToStep: [stepNumber: number]
}>()

const { steps, currentStep, currentStepData } = useBPE()

const collapsedContent = computed(() => {
  if (!currentStepData.value) return 'No steps'
  return `Step ${currentStep.value + 1}/${steps.value.length}: ${currentStepData.value.description}`
})

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
    select: 'Select',
    merge: 'Merge',
    complete: 'Complete'
  }
  return labels[type] || type
}
</script>

<template>
  <CollapsiblePanel title="Steps" :collapsedContent="collapsedContent">
    <div v-if="steps.length === 0" class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
      No steps computed yet
    </div>
    
    <div v-else class="space-y-1 max-h-96 overflow-y-auto">
      <button
        v-for="(step, index) in steps"
        :key="step.stepNumber"
        @click="handleStepClick(step.stepNumber)"
        class="w-full text-left p-3 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-900 group"
        :class="{
          'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-700': step.stepNumber === currentStep,
          'hover:border hover:border-slate-300 dark:hover:border-slate-600': step.stepNumber !== currentStep
        }"
      >
        <div class="flex items-start gap-3">
          <!-- Step Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <div
              v-if="getStepIcon(step.stepNumber) === 'completed'"
              class="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
            >
              <Check :size="12" class="text-white" />
            </div>
            <div
              v-else-if="getStepIcon(step.stepNumber) === 'current'"
              class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center animate-pulse"
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
            <p class="text-sm text-slate-700 dark:text-slate-300 truncate group-hover:text-clip">
              {{ step.description }}
            </p>
          </div>

          <!-- Token Count Badge -->
          <div class="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {{ step.tokensSnapshot.length }}t
          </div>
        </div>
      </button>
    </div>

    <!-- Progress Indicator -->
    <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
      <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
        <span>Progress</span>
        <span>{{ currentStep + 1 }} / {{ steps.length }}</span>
      </div>
      <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
          :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
        ></div>
      </div>
    </div>
  </CollapsiblePanel>
</template>
