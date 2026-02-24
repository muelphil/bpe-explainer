import { computed, readonly } from 'vue'
import { bpeService } from '../services/BPEService'
import type { BPESettings } from '../services/types'

/**
 * Vue composable for accessing BPE service state and methods
 */
export function useBPE() {
  const state = bpeService.getState()

  // Computed properties for convenience
  const currentStep = computed(() => state.currentStep)
  const tokens = computed(() => state.tokens)
  const vocabulary = computed(() => state.vocabulary)
  // Derive frequencies from precomputed step data — always exactly correct for the
  // current step, no reactive dependency on state.tokens needed.
  const frequencies = computed(() => state.steps[state.currentStep]?.pairFrequencies ?? [])
  const compressionRatio = computed(() => state.compressionRatio)
  const steps = computed(() => state.steps)
  const isPlaying = computed(() => state.isPlaying)
  const settings = computed(() => state.settings)
  const currentStepData = computed(() => state.steps[state.currentStep])
  const canGoNext = computed(() => state.currentStep < state.steps.length - 1)
  const canGoPrevious = computed(() => state.currentStep > 0)

  // Methods
  const initialize = (trainingData: string, settings?: Partial<BPESettings>) => {
    bpeService.initialize(trainingData, settings)
  }

  const updateSettings = (settings: Partial<BPESettings>) => {
    bpeService.updateSettings(settings)
  }

  const nextStep = () => bpeService.nextStep()
  const previousStep = () => bpeService.previousStep()
  const goToStep = (stepNumber: number) => bpeService.goToStep(stepNumber)
  const play = () => bpeService.play()
  const pause = () => bpeService.pause()
  const reset = () => bpeService.reset()
  const highlightPair = (pair: [string, string] | null) => bpeService.highlightPair(pair)
  const highlightTokenContent = (content: string | null) => bpeService.highlightTokenContent(content)
  const getHighlightedPositions = () => bpeService.getHighlightedPositions()

  return {
    // State (readonly to prevent direct mutation)
    state: readonly(state),
    
    // Computed
    currentStep,
    tokens,
    vocabulary,
    frequencies,
    compressionRatio,
    steps,
    isPlaying,
    settings,
    currentStepData,
    canGoNext,
    canGoPrevious,

    // Methods
    initialize,
    updateSettings,
    nextStep,
    previousStep,
    goToStep,
    play,
    pause,
    reset,
    highlightPair,
    highlightTokenContent,
    getHighlightedPositions
  }
}
