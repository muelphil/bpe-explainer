<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { Check, Circle } from 'lucide-vue-next'

const emit = defineEmits<{
  goToStep: [stepNumber: number]
}>()

const { steps, currentStep, currentStepData } = useBPE()

const stepsContainerRef = ref<HTMLDivElement | null>(null)

const currentStepItem = computed(() => currentStepData.value)
const otherSteps = computed(() => steps.value.filter(s => s.stepNumber !== currentStep.value))

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

// Auto-scroll current step into view
watch(currentStep, async () => {
  await nextTick()
  if (stepsContainerRef.value) {
    const currentStepElement = stepsContainerRef.value.querySelector(`[data-step="${currentStep.value}"]`)
    if (currentStepElement) {
      currentStepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }
})
</script>

<template>
  <CollapsiblePanel title="Steps">
    <!-- Critical Info (always visible) - Current step only -->
    <template #critical>
      <div v-if="!currentStepItem" class="text-sm text-slate-500 dark:text-slate-400">
        No steps
      </div>
      <button
        v-else
        @click="handleStepClick(currentStepItem.stepNumber)"
        class="w-full text-left p-3 rounded-lg transition-all hover:bg-slate-50 dark:hover:bg-slate-900 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-300 dark:border-primary-700"
      >
        <div class="flex items-start gap-3">
          <!-- Step Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <div class="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center animate-pulse">
              <Circle :size="8" class="text-white fill-white" />
            </div>
          </div>

          <!-- Step Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="px-2 py-0.5 text-xs font-medium rounded"
                :class="{
                  'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300': currentStepItem.type === 'tokenize',
                  'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300': currentStepItem.type === 'select',
                  'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300': currentStepItem.type === 'merge',
                  'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300': currentStepItem.type === 'complete'
                }"
              >
                {{ getStepTypeLabel(currentStepItem.type) }}
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                #{{ currentStepItem.stepNumber }}
              </span>
            </div>
            <p class="text-sm text-slate-700 dark:text-slate-300">
              {{ currentStepItem.description }}
            </p>
          </div>

          <!-- Token Count Badge -->
          <div class="flex-shrink-0 text-xs text-slate-500 dark:text-slate-400 font-mono">
            {{ currentStepItem.tokensSnapshot.length }}t
          </div>
        </div>
      </button>
    </template>

    <!-- Details (collapsible) - All steps + progress -->
    <template #details>
      <div class="flex flex-col h-full -m-4">
        <!-- All Steps List (flex-1 to use remaining space) -->
        <div ref="stepsContainerRef" class="flex-1 overflow-y-auto p-4 space-y-1">
          <button
            v-for="(step, index) in steps"
            :key="step.stepNumber"
            :data-step="step.stepNumber"
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
                <p class="text-sm text-slate-700 dark:text-slate-300">
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

        <!-- Progress Section (fixed size) -->
        <div class="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span>Progress</span>
            <span>{{ Math.round(((currentStep + 1) / steps.length) * 100) }}%</span>
          </div>
          <div class="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-primary-400 to-primary-600 transition-all duration-300"
              :style="{ width: `${((currentStep + 1) / steps.length) * 100}%` }"
            ></div>
          </div>
        </div>
      </div>
    </template>
  </CollapsiblePanel>
</template>
