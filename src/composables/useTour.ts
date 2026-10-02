import { computed, ref } from 'vue'
import { useBPE } from './useBPE'
import { TOUR_STEPS } from '../data/tourSteps'
import type { TourMode, TourPanel, TourTarget } from '../data/tourSteps'

/** Step the tour jumps to when started at step 0, so merged/greyed-out tokens exist */
export const TOUR_JUMP_STEP = 10

const MOBILE_QUERY = '(max-width: 875px)'

const isMobileNow = () =>
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(MOBILE_QUERY).matches
    : false

// --- Shared UI state (module-level singletons) ---

/** Sidebar panel expansion, driven by App.vue (v-model) and by the tour */
const panelExpanded = {
  frequency: ref(true),
  vocabulary: ref(true),
  steps: ref(true),
}

/** Current view mode, owned by MainView */
const viewMode = ref<TourMode>('training')

/** Mode the tour wants MainView to switch to; MainView consumes and clears it */
const requestedMode = ref<TourMode | null>(null)

/** Target whose header/element should pulse (set by GuidedTour depending on settings) */
const pulseTarget = ref<TourTarget | null>(null)

// --- Tour state ---

const isActive = ref(false)
const stepIndex = ref(0)

interface TourSnapshot {
  bpeStep: number
  jumped: boolean
  mode: TourMode
  panels: Record<TourPanel, boolean>
}

let snapshot: TourSnapshot | null = null

const currentStep = computed(() => (isActive.value ? TOUR_STEPS[stepIndex.value] ?? null : null))

const setPanels = (open: TourPanel | null) => {
  panelExpanded.frequency.value = open === 'frequency'
  panelExpanded.vocabulary.value = open === 'vocabulary'
  panelExpanded.steps.value = open === 'steps'
}

const requestMode = (mode: TourMode) => {
  if (viewMode.value !== mode) requestedMode.value = mode
}

const applyStep = () => {
  const step = TOUR_STEPS[stepIndex.value]
  if (!step) return
  requestMode(step.mode)
  const expand = isMobileNow() && step.mobileExpand !== undefined ? step.mobileExpand : step.expand
  if (expand !== undefined) setPanels(expand)
}

const start = () => {
  const { state, steps, pause, goToStep } = useBPE()
  pause()

  const jumped = state.currentStep === 0 && steps.value.length > 1
  snapshot = {
    bpeStep: state.currentStep,
    jumped,
    mode: viewMode.value,
    panels: {
      frequency: panelExpanded.frequency.value,
      vocabulary: panelExpanded.vocabulary.value,
      steps: panelExpanded.steps.value,
    },
  }
  if (jumped) goToStep(Math.min(TOUR_JUMP_STEP, steps.value.length - 1))

  stepIndex.value = 0
  isActive.value = true
  applyStep()
}

const goTo = (index: number) => {
  if (!isActive.value) return
  stepIndex.value = Math.max(0, Math.min(TOUR_STEPS.length - 1, index))
  applyStep()
}

const next = () => {
  if (stepIndex.value >= TOUR_STEPS.length - 1) exit()
  else goTo(stepIndex.value + 1)
}

const prev = () => goTo(stepIndex.value - 1)

const exit = () => {
  if (!isActive.value) return
  isActive.value = false
  pulseTarget.value = null
  if (!snapshot) return

  const { pause, goToStep } = useBPE()
  pause()
  requestMode(snapshot.mode)
  panelExpanded.frequency.value = snapshot.panels.frequency
  panelExpanded.vocabulary.value = snapshot.panels.vocabulary
  panelExpanded.steps.value = snapshot.panels.steps
  if (snapshot.jumped) goToStep(snapshot.bpeStep)
  snapshot = null
}

export function useTour() {
  return {
    isActive,
    stepIndex,
    currentStep,
    totalSteps: TOUR_STEPS.length,
    start,
    next,
    prev,
    goTo,
    exit,
    panelExpanded,
    viewMode,
    requestedMode,
    pulseTarget,
  }
}
