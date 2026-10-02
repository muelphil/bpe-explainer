import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTour, TOUR_JUMP_STEP } from '../composables/useTour'
import { useBPE } from '../composables/useBPE'
import { TOUR_STEPS, TOUR_TARGETS } from '../data/tourSteps'

const TRAINING_TEXT = 'the cat sat on the mat with the hat and the bat '.repeat(8)

describe('tour steps', () => {
  it('defines the 8 tour steps with unique ids and known targets', () => {
    expect(TOUR_STEPS).toHaveLength(8)
    expect(new Set(TOUR_STEPS.map(s => s.id)).size).toBe(TOUR_STEPS.length)
    for (const step of TOUR_STEPS) {
      expect(TOUR_TARGETS).toContain(step.target)
    }
  })
})

describe('useTour', () => {
  const tour = useTour()
  const bpe = useBPE()

  beforeEach(() => {
    bpe.initialize(TRAINING_TEXT, { breakCondition: 'maxVocabSize', maxVocabSize: 512 })
    tour.viewMode.value = 'training'
    tour.requestedMode.value = null
    tour.panelExpanded.frequency.value = true
    tour.panelExpanded.vocabulary.value = false
    tour.panelExpanded.steps.value = true
  })

  afterEach(() => {
    tour.exit()
  })

  it('jumps ahead from step 0 and restores the original step on exit', () => {
    expect(bpe.state.currentStep).toBe(0)
    tour.start()
    expect(tour.isActive.value).toBe(true)
    expect(bpe.state.currentStep).toBe(Math.min(TOUR_JUMP_STEP, bpe.steps.value.length - 1))

    tour.exit()
    expect(tour.isActive.value).toBe(false)
    expect(bpe.state.currentStep).toBe(0)
  })

  it('keeps the current step when not at the start', () => {
    bpe.goToStep(3)
    tour.start()
    expect(bpe.state.currentStep).toBe(3)
    tour.exit()
    expect(bpe.state.currentStep).toBe(3)
  })

  it('expands only the explained panel and restores panels on exit', () => {
    tour.start()
    tour.goTo(TOUR_STEPS.findIndex(s => s.id === 'frequency'))
    expect(tour.panelExpanded.frequency.value).toBe(true)
    expect(tour.panelExpanded.vocabulary.value).toBe(false)
    expect(tour.panelExpanded.steps.value).toBe(false)

    tour.prev() // vocabulary step
    expect(tour.panelExpanded.vocabulary.value).toBe(true)
    expect(tour.panelExpanded.frequency.value).toBe(false)

    tour.exit()
    expect(tour.panelExpanded.frequency.value).toBe(true)
    expect(tour.panelExpanded.vocabulary.value).toBe(false)
    expect(tour.panelExpanded.steps.value).toBe(true)
  })

  it('requests mode switches for the training data / validation steps and back', () => {
    tour.start()
    tour.goTo(TOUR_STEPS.findIndex(s => s.id === 'validation'))
    expect(tour.requestedMode.value).toBe('validation')

    // MainView consumes the request
    tour.viewMode.value = 'validation'
    tour.requestedMode.value = null

    tour.next() // finishing the last step ends the tour
    expect(tour.isActive.value).toBe(false)
    expect(tour.requestedMode.value).toBe('training')
  })

  it('clamps navigation to the step range', () => {
    tour.start()
    tour.prev()
    expect(tour.stepIndex.value).toBe(0)
    tour.goTo(99)
    expect(tour.stepIndex.value).toBe(TOUR_STEPS.length - 1)
  })
})
