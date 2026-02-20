<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import CollapsiblePanel from './CollapsiblePanel.vue'
import { useBPE } from '../composables/useBPE'
import { Check, Circle } from 'lucide-vue-next'
import { displayTokenContent, getTokenColor } from '../utils/tokenColor'

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
    select: 'Select most frequent pair',
    merge: 'Merge',
    complete: 'Complete'
  }
  return labels[type] || type
}

// Auto-scroll current step into view
watch(currentStep, async () => {
  await nextTick()
  if (stepsContainerRef.value) {
    // Find the next step after current
    const nextStepNumber = currentStep.value + 1
    const nextStepElement = stepsContainerRef.value.querySelector(`[data-step="${nextStepNumber}"]`)
    if (nextStepElement) {
      // Scroll next step to top so current step appears at fixed position above it
      nextStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }
})
</script>

<template>
  <CollapsiblePanel title="Steps" :criticalPadding="false">
    <!-- Critical Info (always visible) - Current step only -->
    <template #critical>
      <div v-if="!currentStepItem" class="text-sm text-slate-500 dark:text-slate-400">
        No steps
      </div>
      <button
        v-else
        @click="handleStepClick(currentStepItem.stepNumber)"
        class="w-full text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800 bg-primary-50 dark:bg-primary-900/20"
      >
        <div class="flex items-start gap-3 py-3 px-4">
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
            
            <!-- Token Visualization for Select and Merge steps -->
            <div v-if="currentStepItem.type === 'select' && currentStepItem.selectedPair" class="mb-2">
              <div style="display:flex; gap: 2px; align-items: center;">
                <span
                  class="token small no-id"
                  :style="{ backgroundColor: getTokenColor(currentStepItem.selectedPair[0]) }"
                >{{ displayTokenContent(currentStepItem.selectedPair[0]) }}</span>
                <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
                <span
                  class="token small no-id"
                  :style="{ backgroundColor: getTokenColor(currentStepItem.selectedPair[1]) }"
                >{{ displayTokenContent(currentStepItem.selectedPair[1]) }}</span>
              </div>
            </div>
            
            <div v-else-if="currentStepItem.type === 'merge' && currentStepItem.selectedPair && currentStepItem.addedToken" class="mb-2">
              <div style="display:flex; gap: 4px; align-items: center;">
                <span
                  class="token small no-id"
                  :style="{ backgroundColor: getTokenColor(currentStepItem.selectedPair[0]) }"
                >{{ displayTokenContent(currentStepItem.selectedPair[0]) }}</span>
                <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
                <span
                  class="token small no-id"
                  :style="{ backgroundColor: getTokenColor(currentStepItem.selectedPair[1]) }"
                >{{ displayTokenContent(currentStepItem.selectedPair[1]) }}</span>
                <span class="text-slate-400 dark:text-slate-500 text-xs">→</span>
                <span
                  class="token small no-id"
                  :style="currentStepItem.addedToken.color ? { backgroundColor: currentStepItem.addedToken.color } : {}"
                >{{ displayTokenContent(currentStepItem.addedToken.content) }}</span>
              </div>
            </div>
            
            <p v-else class="text-sm text-slate-700 dark:text-slate-300">
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
        <div ref="stepsContainerRef" class="flex-1 overflow-y-auto">
          <button
            v-for="(step, index) in steps"
            :key="step.stepNumber"
            :data-step="step.stepNumber"
            @click="handleStepClick(step.stepNumber)"
            class="w-full text-left transition-all hover:bg-slate-100 dark:hover:bg-slate-800 border-b border-slate-200 dark:border-slate-700"
            :class="{
              'bg-primary-50 dark:bg-primary-900/20': step.stepNumber === currentStep
            }"
          >
            <div class="flex items-start gap-3 py-3 px-4">
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
                
                <!-- Token Visualization for Select and Merge steps -->
                <div v-if="step.type === 'select' && step.selectedPair" class="mb-1">
                  <div style="display:flex; gap: 2px; align-items: center;">
                    <span
                      class="token small no-id"
                      :style="{ backgroundColor: getTokenColor(step.selectedPair[0]) }"
                    >{{ displayTokenContent(step.selectedPair[0]) }}</span>
                    <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
                    <span
                      class="token small no-id"
                      :style="{ backgroundColor: getTokenColor(step.selectedPair[1]) }"
                    >{{ displayTokenContent(step.selectedPair[1]) }}</span>
                  </div>
                </div>
                
                <div v-else-if="step.type === 'merge' && step.selectedPair && step.addedToken" class="mb-1">
                  <div style="display:flex; gap: 4px; align-items: center;">
                    <span
                      class="token small no-id"
                      :style="{ backgroundColor: getTokenColor(step.selectedPair[0]) }"
                    >{{ displayTokenContent(step.selectedPair[0]) }}</span>
                    <span class="text-slate-400 dark:text-slate-500 text-xs">+</span>
                    <span
                      class="token small no-id"
                      :style="{ backgroundColor: getTokenColor(step.selectedPair[1]) }"
                    >{{ displayTokenContent(step.selectedPair[1]) }}</span>
                    <span class="text-slate-400 dark:text-slate-500 text-xs">→</span>
                    <span
                      class="token small no-id"
                      :style="step.addedToken.color ? { backgroundColor: step.addedToken.color } : {}"
                    >{{ displayTokenContent(step.addedToken.content) }}</span>
                  </div>
                </div>
                
                <p v-else class="text-sm text-slate-700 dark:text-slate-300">
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
      </div>
    </template>
  </CollapsiblePanel>
</template>
