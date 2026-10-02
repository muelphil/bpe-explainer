<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref, watch} from 'vue'
import {X, ChevronLeft, ChevronRight} from 'lucide-vue-next'
import {useTour} from '../composables/useTour'
import {useBPE} from '../composables/useBPE'
import {useIsMobile} from '../composables/useIsMobile'
import {TOUR_STEPS} from '../data/tourSteps'
import type {TourTarget} from '../data/tourSteps'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

const TWEEN_MS = 450 // Cutout morph duration between steps
const RING_PAD = 0 // Gap between the explained element and its border (the cutouts have none)
const RING_PAD_MODE_BUTTONS = 2 // Same, for the Training Data / Validation header buttons
const RING_WIDTH = 3 // Must match the box-shadow spread of .tour-ring
const CARD_WIDTH = 340
const CARD_GAP = 16
const VIEWPORT_MARGIN = 12
const SIDEBAR_TARGETS = new Set<TourTarget>(['vocabulary', 'frequency', 'steps', 'controls'])

const tour = useTour()
const {isActive, currentStep, stepIndex, totalSteps} = tour
const {settings} = useBPE()
const {isMobile} = useIsMobile()

// Mobile: pulse only, no spotlight
const spotlightEnabled = computed(() => !isMobile.value && settings.value.tourSpotlight)
const pulseEnabled = computed(() => isMobile.value || settings.value.tourPulse)

const cardRef = ref<HTMLDivElement | null>(null)
/** Spotlight cutouts as displayed (animated): the main token view and the explained element */
const cutouts = ref<Rect[]>([])
/** Rect of the explained element as displayed (follows the animated cutout when the spotlight is on) */
const highlightRect = ref<Rect | null>(null)
/** Border is faded out (while it jumps between distant areas instead of sliding) */
const ringHidden = ref(false)
/** Border padding for the element the border currently surrounds */
const highlightPad = ref(RING_PAD)
const cardPos = ref<{ left: number, top: number } | null>(null)
const mobileCardAtTop = ref(false)

const isLastStep = computed(() => stepIndex.value === totalSteps - 1)

// --- Geometry helpers ---

/** Union of all visible elements carrying the given data-tour id (panels render fragments). */
const measure = (target: TourTarget): Rect | null => {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity
  document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`).forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    left = Math.min(left, r.left)
    top = Math.min(top, r.top)
    right = Math.max(right, r.right)
    bottom = Math.max(bottom, r.bottom)
  })
  return left === Infinity ? null : {x: left, y: top, w: right - left, h: bottom - top}
}

const pad = (r: Rect, p: number): Rect => ({x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p})

/** Zero-size rect at the centre of r: cutouts grow from / shrink into it */
const collapse = (r: Rect): Rect => ({x: r.x + r.w / 2, y: r.y + r.h / 2, w: 0, h: 0})

const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
})

const sameRect = (a: Rect | null | undefined, b: Rect | null | undefined) =>
  a === b || (!!a && !!b && Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.w - b.w) < 0.5 && Math.abs(a.h - b.h) < 0.5)

const sameRects = (a: Rect[], b: Rect[]) => a.length === b.length && a.every((r, i) => sameRect(r, b[i]))

const contains = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// --- Animation loop: re-measure every frame so cutouts follow layout changes ---
// The dimming stays in place for the whole tour; between steps the cutouts morph from
// their previous position to the new one, so previously obscured areas stay obscured.
// A new cutout grows from the part of it that was already unobscured (or from its centre),
// a removed one shrinks into the part that stays unobscured (or into its centre), so
// areas that stay unobscured across a step change never flash dark.

let rafId: number | null = null
let animStart = -Infinity
let fromMain: Rect | null = null
let fromTarget: Rect | null = null
let fromExtra: Rect | null = null
let displayedMain: Rect | null = null
let displayedTarget: Rect | null = null
let displayedExtra: Rect | null = null
/** All cutouts as displayed when the current step transition started */
let fromCutouts: Rect[] = []
/** Target of the previous step, and whether the border fades (instead of slides) to the new one */
let lastTarget: TourTarget | null = null
let fadeRing = false
/** Fading border: stays hidden until this time, then reappears at the new element */
let ringHiddenUntil = 0

const intersect = (a: Rect, b: Rect): Rect | null => {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const w = Math.min(a.x + a.w, b.x + b.w) - x
  const h = Math.min(a.y + a.h, b.y + b.h) - y
  return w > 0 && h > 0 ? {x, y, w, h} : null
}

/** Largest overlap of r with any of the given rects */
const largestOverlap = (r: Rect, others: Rect[]): Rect | null => {
  let best: Rect | null = null
  for (const o of others) {
    const i = intersect(r, o)
    if (i && (!best || i.w * i.h > best.w * best.h)) best = i
  }
  return best
}

/** Morph a cutout: grow in if new, slide/resize if moved, shrink away if removed */
const morph = (from: Rect | null, live: Rect | null, liveAll: Rect[], e: number, p: number): Rect | null => {
  if (live) return lerpRect(from ?? largestOverlap(live, fromCutouts) ?? collapse(live), live, e)
  if (!from || p >= 1) return null
  return lerpRect(from, largestOverlap(from, liveAll) ?? collapse(from), e)
}

const tick = () => {
  rafId = requestAnimationFrame(tick)
  const step = currentStep.value
  if (!step) return

  const rawTarget = measure(step.target)
  const rawMain = measure('main')
  // Cutouts hug the elements exactly; only the border gets padding (see ringStyle)
  const liveMain = rawMain
  const liveTarget = step.target === 'main' ? null : rawTarget
  const liveExtra = step.unobscured?.[0] ? measure(step.unobscured[0]) : null

  const p = prefersReducedMotion() ? 1 : Math.min(1, (performance.now() - animStart) / TWEEN_MS)
  const e = easeInOutCubic(p)

  const liveAll = [liveMain, liveTarget, liveExtra].filter((r): r is Rect => r !== null)
  displayedMain = morph(fromMain, liveMain, liveAll, e, p)
  displayedTarget = morph(fromTarget, liveTarget, liveAll, e, p)
  displayedExtra = morph(fromExtra, liveExtra, liveAll, e, p)

  const next = [displayedMain, displayedTarget, displayedExtra].filter((r): r is Rect => r !== null)
  if (!sameRects(next, cutouts.value)) cutouts.value = next

  // Highlight border: only the explained element (the main view only on its own steps)
  const shownHighlight = step.target === 'main'
    ? displayedMain
    : spotlightEnabled.value ? liveTarget && displayedTarget : liveTarget
  if (fadeRing && performance.now() < ringHiddenUntil) {
    // Fade out in place; reappears at the new element once the transition is done
    ringHidden.value = true
  } else {
    ringHidden.value = false
    if (!sameRect(shownHighlight, highlightRect.value)) highlightRect.value = shownHighlight
    highlightPad.value = step.target.startsWith('mode-') ? RING_PAD_MODE_BUTTONS : RING_PAD
  }

  updateCardPosition(step.target, rawTarget)
}

/** Called on every step change: morph from what's currently displayed to the new step. */
const beginStepTransition = () => {
  fromMain = displayedMain && {...displayedMain}
  fromTarget = displayedTarget && {...displayedTarget}
  fromExtra = displayedExtra && {...displayedExtra}
  fromCutouts = cutouts.value.map(r => ({...r}))
  // Between a sidebar/main-view element and a header tab button (steps 6 <-> 7) the border
  // vanishes and reappears instead of travelling across the screen, and the dimming switches
  // instantly to the new layout (the view mode changes there) instead of morphing
  const target = currentStep.value?.target ?? null
  fadeRing = !!lastTarget && !!target && lastTarget.startsWith('mode-') !== target.startsWith('mode-')
  lastTarget = target
  animStart = fadeRing ? -Infinity : performance.now()
  ringHiddenUntil = performance.now() + TWEEN_MS
}

const updateCardPosition = (targetId: TourTarget, target: Rect | null) => {
  const vh = window.innerHeight
  if (isMobile.value) {
    // Bottom sheet, unless the target sits in the lower part of the screen (e.g. controls)
    const atTop = !!target && target.y + target.h / 2 > vh * 0.55
    if (atTop !== mobileCardAtTop.value) mobileCardAtTop.value = atTop
    return
  }

  const vw = window.innerWidth
  const cardH = cardRef.value?.offsetHeight ?? 220
  let left: number
  let top: number

  if (!target) {
    left = (vw - CARD_WIDTH) / 2
    top = vh - cardH - 24
  } else if (SIDEBAR_TARGETS.has(targetId)) {
    // Left of the sidebar, aligned with the panel
    left = target.x - CARD_WIDTH - CARD_GAP
    top = target.y
  } else if (targetId.startsWith('mode-')) {
    // Below the header button
    left = target.x + target.w - CARD_WIDTH
    top = target.y + target.h + CARD_GAP
  } else {
    // Bottom-centre of the main view
    left = target.x + (target.w - CARD_WIDTH) / 2
    top = target.y + target.h - cardH - 24
  }

  left = Math.max(VIEWPORT_MARGIN, Math.min(vw - CARD_WIDTH - VIEWPORT_MARGIN, left))
  top = Math.max(VIEWPORT_MARGIN, Math.min(vh - cardH - VIEWPORT_MARGIN, top))
  if (!cardPos.value || Math.abs(cardPos.value.left - left) > 0.5 || Math.abs(cardPos.value.top - top) > 0.5) {
    cardPos.value = {left, top}
  }
}

const scrollTargetIntoView = () => {
  const target = currentStep.value?.target
  if (!isMobile.value || !target) return
  // Let panels expand/collapse first
  setTimeout(() => {
    document.querySelector(`[data-tour="${target}"]`)?.scrollIntoView({block: 'nearest', behavior: 'smooth'})
  }, 60)
}

/** Scroll `el` to the vertical centre of its scroll container `container` (without scrolling the page) */
const scrollWithin = (container: HTMLElement, el: HTMLElement) => {
  const c = container.getBoundingClientRect()
  const r = el.getBoundingClientRect()
  const top = container.scrollTop + (r.top - c.top) - (c.height - r.height) / 2
  container.scrollTo({top: Math.max(0, top), behavior: 'instant'})
}

/**
 * Bring the highlighted (step-locked) vocabulary token into view. Runs when the tour starts,
 * so the panel is already in place on the Vocabulary step; on that step it only scrolls as a
 * fallback, if the token isn't visible (e.g. the panel was collapsed at the start).
 */
const scrollToHighlightedVocabToken = (onlyIfHidden: boolean) => {
  // Let the panel expand / the jumped-to training step render first
  setTimeout(() => {
    const container = document.querySelector<HTMLElement>('.panel-details[data-tour="vocabulary"]')
    const token = container?.querySelector<HTMLElement>('.highlight-single')
    if (!container || !token) return
    if (onlyIfHidden) {
      const c = container.getBoundingClientRect()
      const r = token.getBoundingClientRect()
      if (r.top >= c.top && r.bottom <= c.bottom) return
    }
    scrollWithin(container, token)
  }, 60)
}

const resetAnimation = () => {
  fromMain = fromTarget = fromExtra = displayedMain = displayedTarget = displayedExtra = null
  fromCutouts = []
  lastTarget = currentStep.value?.target ?? null
  fadeRing = false
  ringHidden.value = false
  animStart = -Infinity
  cutouts.value = []
  highlightRect.value = null
}

const startLoop = () => {
  if (rafId === null) rafId = requestAnimationFrame(tick)
}

const stopLoop = () => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = null
}

// --- Input: keyboard navigation, clicking the dimmed area ends the tour ---

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    tour.exit()
  } else if (!isEditable(e.target)) {
    if (e.key === 'ArrowRight') tour.next()
    else if (e.key === 'ArrowLeft') tour.prev()
  }
}

// The overlay itself has pointer-events: none so the cutouts stay fully interactive;
// presses on the dimmed area are intercepted here instead (capture phase).
let swallowNextClick = false

const handlePointerDown = (e: PointerEvent) => {
  if (!isActive.value || !spotlightEnabled.value) return
  if (cardRef.value?.contains(e.target as Node)) return
  if (cutouts.value.some(r => contains(r, e.clientX, e.clientY))) return
  e.preventDefault()
  e.stopPropagation()
  swallowNextClick = true
  tour.exit()
}

const handleClickCapture = (e: MouseEvent) => {
  if (!swallowNextClick) return
  swallowNextClick = false
  e.preventDefault()
  e.stopPropagation()
}

// --- Reactions ---

watch(isActive, (active) => {
  if (active) {
    window.addEventListener('keydown', handleKeydown)
    window.addEventListener('pointerdown', handlePointerDown, true)
    resetAnimation()
    cardPos.value = null
    startLoop()
  } else {
    window.removeEventListener('keydown', handleKeydown)
    window.removeEventListener('pointerdown', handlePointerDown, true)
    stopLoop()
  }
})

watch(stepIndex, async () => {
  if (!isActive.value) return
  await nextTick()
  beginStepTransition()
  scrollTargetIntoView()
  if (currentStep.value?.target === 'vocabulary') scrollToHighlightedVocabToken(true)
})

watch(isActive, async (active) => {
  if (!active) return
  await nextTick()
  scrollTargetIntoView()
  scrollToHighlightedVocabToken(false)
})

watch([isActive, currentStep, pulseEnabled], () => {
  tour.pulseTarget.value = isActive.value && pulseEnabled.value ? currentStep.value?.target ?? null : null
}, {immediate: true})

onMounted(() => {
  window.addEventListener('click', handleClickCapture, true)
})

onUnmounted(() => {
  stopLoop()
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('pointerdown', handlePointerDown, true)
  window.removeEventListener('click', handleClickCapture, true)
})

const cardStyle = computed(() => {
  if (isMobile.value) return {}
  return cardPos.value
    ? {left: `${cardPos.value.left}px`, top: `${cardPos.value.top}px`, width: `${CARD_WIDTH}px`}
    : {left: '50%', bottom: '24px', width: `${CARD_WIDTH}px`, transform: 'translateX(-50%)'}
})

const ringStyle = computed(() => {
  if (!highlightRect.value) return {}
  const r = pad(highlightRect.value, highlightPad.value)
  // Keep the (outset) border fully inside the viewport, dropping the padding at the edges if needed
  const left = Math.max(RING_WIDTH, r.x)
  const top = Math.max(RING_WIDTH, r.y)
  const right = Math.min(window.innerWidth - RING_WIDTH, r.x + r.w)
  const bottom = Math.min(window.innerHeight - RING_WIDTH, r.y + r.h)
  return {left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px`}
})
</script>

<template>
  <Teleport to="body">
    <!-- Spotlight: dims everything except the token view and the explained element. -->
    <Transition name="tour-fade">
      <svg
        v-if="isActive && spotlightEnabled"
        class="tour-spotlight fixed inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white"/>
            <rect
              v-for="(r, i) in cutouts"
              :key="i"
              :x="r.x" :y="r.y" :width="r.w" :height="r.h"
              fill="black"
            />
          </mask>
        </defs>
        <rect x="0" y="0" width="100%" height="100%" class="tour-spotlight-dim" mask="url(#tour-spotlight-mask)"/>
      </svg>
    </Transition>

    <!-- Border around the explained element (pulses if enabled). Not on mobile: the
         explained panel already takes up most of the screen. -->
    <div
      v-if="isActive && !isMobile && highlightRect && highlightRect.w > 0"
      class="tour-ring fixed pointer-events-none"
      :class="{ 'tour-ring--pulse': pulseEnabled, 'tour-ring--hidden': ringHidden }"
      :style="ringStyle"
      aria-hidden="true"
    />

    <!-- Tour card -->
    <Transition name="tour-fade">
      <div
        v-if="isActive && currentStep"
        ref="cardRef"
        class="tour-card fixed rounded-xl overflow-hidden bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-100"
        :class="isMobile ? ['inset-x-2 overflow-y-auto', mobileCardAtTop ? 'top-2' : 'bottom-2'] : ''"
        :style="cardStyle"
        role="dialog"
        aria-live="polite"
        :aria-label="`Guided tour: ${currentStep.title}`"
      >
        <div class="flex items-start justify-between gap-3 px-4 pt-4">
          <div>
            <div class="text-xs font-medium uppercase tracking-wide text-primary-600 dark:text-primary-300">
              Guided tour · {{ stepIndex + 1 }} / {{ totalSteps }}
            </div>
            <h3 class="text-base font-semibold text-slate-900 dark:text-white">{{ currentStep.title }}</h3>
          </div>
          <button
            @click="tour.exit()"
            class="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
            title="End tour (Esc)"
          >
            <X :size="18"/>
          </button>
        </div>

        <div class="px-4 pb-4 pt-2">
          <!-- eslint-disable-next-line vue/no-v-html -- static, trusted tour text -->
          <p class="text-sm leading-relaxed" v-html="currentStep.body"></p>

          <div class="flex items-center justify-between gap-3 mt-4">
            <div class="flex gap-1.5">
              <button
                v-for="(step, i) in TOUR_STEPS"
                :key="step.id"
                @click="tour.goTo(i)"
                class="w-2 h-2 rounded-full transition-colors"
                :class="i === stepIndex ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-500 hover:bg-slate-400'"
                :title="step.title"
                :aria-label="`Go to tour step ${i + 1}: ${step.title}`"
              />
            </div>
            <div class="flex gap-2">
              <button
                @click="tour.prev()"
                :disabled="stepIndex === 0"
                class="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft :size="16"/>
                Back
              </button>
              <button
                @click="tour.next()"
                class="px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1 bg-primary-500 text-white hover:bg-primary-600 transition-colors"
              >
                {{ isLastStep ? 'Finish' : 'Next' }}
                <ChevronRight v-if="!isLastStep" :size="16"/>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tour-spotlight {
  z-index: 40;
}

.tour-spotlight-dim {
  fill: rgba(15, 23, 42, 0.68);
}

.dark .tour-spotlight-dim {
  fill: rgba(0, 0, 0, 0.74);
}

.tour-ring {
  z-index: 110; /* above the mobile mode dropdown (z-index 100) */
  box-shadow: 0 0 0 3px var(--primary);
  transition: opacity 0.15s ease;
}

.tour-ring--hidden {
  opacity: 0;
}

.tour-ring--pulse {
  animation: tour-ring 1.6s ease-in-out infinite;
}

.tour-card {
  z-index: 120;
  max-height: 45vh;
  border: 2px solid #3b82f6;
  box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.45);
}

@media (min-width: 876px) {
  .tour-card {
    max-height: none;
  }
}

@keyframes tour-ring {
  0%, 100% {
    box-shadow: 0 0 0 3px var(--primary), 0 0 0 0 rgba(59, 130, 246, 0.45);
  }
  50% {
    box-shadow: 0 0 0 3px var(--primary), 0 0 0 8px rgba(59, 130, 246, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .tour-ring--pulse {
    animation: none;
  }
}

.tour-fade-enter-active,
.tour-fade-leave-active {
  transition: opacity 0.25s ease;
}

.tour-fade-enter-from,
.tour-fade-leave-to {
  opacity: 0;
}
</style>
