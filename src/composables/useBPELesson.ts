import { computed, ref } from 'vue'
import { BPE_LESSONS, getLesson } from '../data/bpeLesson'
import type { GuideTarget, LessonId } from '../data/bpeLesson'
import { useBPE } from './useBPE'

const TOUR_DISMISSED_KEY = 'bpe-lesson-tour-dismissed'

export function useBPELesson() {
  const { currentStep, goToStep, steps } = useBPE()
  const activeLessonId = ref<LessonId | null>(null)
  const isTourOpen = ref(false)
  const isSyncEnabled = ref(false)
  const requestedMode = ref<'training' | 'validation' | null>(null)

  const activeLesson = computed(() =>
    activeLessonId.value ? getLesson(activeLessonId.value) : null
  )
  const activeTarget = computed<GuideTarget | null>(() => activeLesson.value?.target ?? null)
  const lessonIndex = computed(() =>
    activeLessonId.value
      ? BPE_LESSONS.findIndex(lesson => lesson.id === activeLessonId.value)
      : -1
  )
  const progress = computed(() =>
    lessonIndex.value < 0 ? 0 : lessonIndex.value + 1
  )
  const status = computed(() => {
    if (isTourOpen.value && activeLesson.value) {
      return `Tour ${progress.value} of ${BPE_LESSONS.length}`
    }
    if (isSyncEnabled.value && activeLesson.value) {
      return `Following: ${activeLesson.value.title}`
    }
    return 'Free exploration'
  })

  const activateLesson = (id: LessonId, options: { openTour?: boolean } = {}) => {
    const lesson = getLesson(id)
    activeLessonId.value = id
    requestedMode.value = lesson.mode
    if (options.openTour !== false) isTourOpen.value = true

    const stepNumber = lesson.resolveStep(steps.value)
    if (stepNumber !== null && stepNumber !== currentStep.value) goToStep(stepNumber)
  }

  const startTour = () => activateLesson(BPE_LESSONS[0]!.id)

  const nextLesson = () => {
    const next = BPE_LESSONS[lessonIndex.value + 1]
    if (next) activateLesson(next.id)
    else exitTour()
  }

  const previousLesson = () => {
    const previous = BPE_LESSONS[lessonIndex.value - 1]
    if (previous) activateLesson(previous.id)
  }

  const exitTour = () => {
    isTourOpen.value = false
    localStorage.setItem(TOUR_DISMISSED_KEY, 'true')
  }

  const toggleSync = () => {
    isSyncEnabled.value = !isSyncEnabled.value
    if (isSyncEnabled.value && !activeLessonId.value) {
      activateLesson(BPE_LESSONS[0]!.id, { openTour: false })
    }
  }

  const handleArticleLesson = (id: LessonId) => {
    activateLesson(id, { openTour: false })
  }

  const clearRequestedMode = () => {
    requestedMode.value = null
  }

  return {
    activeLesson,
    activeLessonId,
    activeTarget,
    isSyncEnabled,
    isTourOpen,
    lessonIndex,
    progress,
    requestedMode,
    status,
    activateLesson,
    clearRequestedMode,
    exitTour,
    handleArticleLesson,
    nextLesson,
    previousLesson,
    startTour,
    toggleSync,
  }
}
