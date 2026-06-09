<script setup lang="ts">
import { ref, onBeforeUnmount, nextTick } from 'vue'

const props = withDefaults(defineProps<{
  startTokens?: string[]
  inferredTokens?: string[]
  speed?: number
}>(), {
  startTokens: () => ['Paris', 'is', 'the'],
  inferredTokens: () => [' city', 'of', 'light', '.', '<endoftext>'],
  speed: 1
})

const containerRef = ref<HTMLDivElement | null>(null)
const cloneLayerRef = ref<HTMLDivElement | null>(null)

// Stable array of future token wrapper elements — collected after each scene render
const futureWrappers = ref<HTMLElement[]>([])

// Key to force Vue to re-render the scene DOM on restart
// (equivalent to original buildScene() which does scene.innerHTML = '' + rebuild)
const sceneKey = ref(0)

const animState = ref<'idle' | 'playing' | 'paused' | 'done'>('idle')
const showOverlay = ref(true)
const showReload = ref(false)

let generationCounter = 0

function tokenId(s: string): number {
  if (s.length === 1) return s.charCodeAt(0)
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) & 0x7fff
  }
  return (Math.abs(h) % 49488) + 512
}

function D(ms: number): number {
  return Math.round(ms / props.speed)
}

function getScene(): HTMLElement | null {
  return containerRef.value?.querySelector('.token-llm-scene') ?? null
}

/* ── pause / resume / cancel ─────────────────────────────────────────────── */
function pauseAll() {
  animState.value = 'paused'
  showOverlay.value = true
  containerRef.value?.querySelectorAll('*').forEach(el => {
    el.getAnimations().forEach(a => a.pause())
  })
}

function resumeAll() {
  animState.value = 'playing'
  showOverlay.value = false
  containerRef.value?.querySelectorAll('*').forEach(el => {
    el.getAnimations().forEach(a => a.play())
  })
}

function cancelAll() {
  generationCounter++
  if (cloneLayerRef.value) cloneLayerRef.value.innerHTML = ''
  containerRef.value?.querySelectorAll('*').forEach(el => {
    el.getAnimations().forEach(a => a.cancel())
  })
}

/* ── Waapi helper (matches original pattern) ─────────────────────────────── */
async function animWait(gen: number, el: HTMLElement, kf: Keyframe[], opts: KeyframeAnimationOptions): Promise<boolean> {
  if (generationCounter !== gen) return false
  return new Promise<boolean>(resolve => {
    const a = el.animate(kf, { fill: 'forwards', ...opts })
    if (animState.value === 'paused') a.pause()
    a.onfinish = () => resolve(true)
  })
}

/* ── single inference step ──────────────────────────────────────────────── */
async function inferOneToken(gen: number, stepIndex: number): Promise<boolean> {
  if (generationCounter !== gen) return false

  const scene = getScene()
  const cloneLayer = cloneLayerRef.value
  const containerRect = containerRef.value!.getBoundingClientRect()
  const llmEl = scene!.querySelector('.llm-block') as HTMLElement | null
  if (!llmEl) return false

  const llmR = llmEl.getBoundingClientRect()
  const llmCX = llmR.left - containerRect.left + llmR.width / 2
  const llmCY = llmR.top - containerRect.top + llmR.height / 2

  /* 1 — context tokens fly into LLM */
  const ctxEls: HTMLElement[] = []
  let cur = scene!.firstChild
  while (cur && cur !== llmEl) {
    if (cur.nodeType === 1) ctxEls.push(cur as HTMLElement)
    cur = cur.nextSibling
  }

  await Promise.all(ctxEls.map((el, i) => {
    return new Promise<void>(res => {
      if (generationCounter !== gen) { res(); return }
      const r = el.getBoundingClientRect()
      const ex = r.left - containerRect.left, ey = r.top - containerRect.top
      const tx = llmCX - ex - r.width / 2, ty = llmCY - ey - r.height / 2
      const clone = el.cloneNode(true) as HTMLElement
      Object.assign(clone.style, {
        position: 'absolute', left: ex + 'px', top: ey + 'px',
        margin: '0', pointerEvents: 'none', width: r.width + 'px'
      })
      cloneLayer!.appendChild(clone)
      const a = clone.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}px,${ty}px) scale(0.08)`, opacity: 0 }
      ], { duration: D(360), delay: i * D(40), easing: 'ease-in', fill: 'forwards' })
      if (animState.value === 'paused') a.pause()
      a.onfinish = () => { clone.remove(); res() }
    })
  }))
  if (generationCounter !== gen) return false

  /* 2 — LLM pulse */
  llmEl.getAnimations().forEach(a => a.cancel())
  const pulseOk = await animWait(gen, llmEl, [
    { transform: 'scale(1)', boxShadow: '0 0 22px rgba(96,165,250,0.15)' },
    { transform: 'scale(0.85)', boxShadow: '0 0 8px rgba(96,165,250,0.08)' },
    { transform: 'scale(1.08)', boxShadow: '0 0 38px rgba(96,165,250,0.45)' },
    { transform: 'scale(1)', boxShadow: '0 0 22px rgba(96,165,250,0.15)' }
  ], { duration: D(460), easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'none' })
  if (!pulseOk) return false

  /* 3 — next future token fades in */
  const futureEl = futureWrappers.value[stepIndex]
  if (futureEl) {
    const fadeOk = await animWait(gen, futureEl,
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: D(300) }
    )
    if (!fadeOk) return false

    // Match original: cancel animations, remove class, set opacity — synchronously
    futureEl.getAnimations().forEach(a => a.cancel())
    futureEl.classList.remove('llm-future-token')
    futureEl.style.opacity = '1'
  }

  await new Promise(res => setTimeout(res, D(220)))
  if (generationCounter !== gen) return false

  /* 4 — LLM slides right via FLIP */
  llmEl.getAnimations().forEach(a => a.cancel())
  const firstRect = llmEl.getBoundingClientRect()
  // Use the same futureEl ref (not re-queried) for insertBefore
  scene!.insertBefore(llmEl, futureEl?.nextSibling || null)
  const lastRect = llmEl.getBoundingClientRect()
  const dx = firstRect.left - lastRect.left
  const dy = firstRect.top - lastRect.top

  if (dx !== 0 || dy !== 0) {
    const flipOk = await animWait(gen, llmEl, [
      { transform: `translate(${dx}px,${dy}px)` },
      { transform: 'translate(0,0)' }
    ], { duration: D(380), easing: 'cubic-bezier(0.4,0,0.2,1)', fill: 'none' })
    if (!flipOk) return false
  }

  await new Promise(res => setTimeout(res, D(160)))
  return true
}

/* ── full animation loop ─────────────────────────────────────────────────── */
async function runAnimation() {
  const myGen = generationCounter
  animState.value = 'playing'
  showReload.value = false

  for (let i = 0; i < props.inferredTokens.length; i++) {
    const ok = await inferOneToken(myGen, i)
    if (!ok) return
  }

  if (generationCounter === myGen) {
    const scene = getScene()
    const llmEl = scene?.querySelector('.llm-block')
    if (llmEl) llmEl.remove()
    animState.value = 'done'
    showReload.value = true
  }
}

/* ── collect future token wrappers after scene render ────────────────────── */
function collectFutureWrappers() {
  const scene = getScene()
  if (scene) {
    futureWrappers.value = Array.from(scene.querySelectorAll('.llm-future-token'))
  }
}

/* ── start / restart (matches original startAnim: cancel + buildScene) ──── */
function startAnim() {
  cancelAll()
  animState.value = 'idle'
  showReload.value = false
  showOverlay.value = true

  // Force Vue to fully re-render the scene — restores LLM block, future token classes
  sceneKey.value++

  nextTick(() => {
    collectFutureWrappers()
    showOverlay.value = false
    requestAnimationFrame(() => runAnimation())
  })
}

/* ── events ──────────────────────────────────────────────────────────────── */
function handleClick(e: Event) {
  e.stopPropagation()
  if (animState.value === 'playing') pauseAll()
  else if (animState.value === 'paused') resumeAll()
  else startAnim()
}

function handleOverlayClick(e: Event) {
  e.stopPropagation()
  if (animState.value === 'paused') {
    resumeAll()
  } else {
    showOverlay.value = false
    startAnim()
  }
}

function handleReload(e: Event) {
  e.stopPropagation()
  startAnim()
}

// Initial collection + idle — wait for user to click overlay
nextTick(() => {
  collectFutureWrappers()
})

onBeforeUnmount(() => {
  containerRef.value?.querySelectorAll('*').forEach(el => {
    el.getAnimations().forEach(a => a.cancel())
  })
})
</script>

<template>
  <div
    ref="containerRef"
    class="token-anim-container"
    @click="handleClick"
  >
    <!-- key forces Vue to destroy/re-create the scene DOM on restart -->
    <div :key="sceneKey" class="token-llm-scene">
      <div
        v-for="(token, idx) in startTokens"
        :key="'start-' + idx"
        class="token-wrapper"
      >
        <span class="token">
          {{ token }}
          <span class="token-id">{{ tokenId(token) }}</span>
        </span>
      </div>

      <div class="llm-block">LLM</div>

      <div
        v-for="(token, idx) in inferredTokens"
        :key="'infer-' + idx"
        class="token-wrapper llm-future-token"
      >
        <span class="token">
          {{ token }}
          <span class="token-id">{{ tokenId(token) }}</span>
        </span>
      </div>
    </div>

    <div ref="cloneLayerRef" class="llm-clone-layer"></div>

    <div
      v-if="showOverlay && animState !== 'playing'"
      class="token-anim-overlay"
      @click.stop="handleOverlayClick"
    >
      <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Play">
        <circle cx="28" cy="28" r="27" stroke="rgba(255,255,255,0.55)" stroke-width="1.5" fill="rgba(255,255,255,0.07)" />
        <polygon points="22,17 42,28 22,39" fill="rgba(255,255,255,0.88)" />
      </svg>
    </div>

    <div
      v-if="showReload"
      class="token-anim-reload"
      @click.stop="handleReload"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
        <path d="M21 3v5h-5" />
        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
        <path d="M8 16H3v5" />
      </svg>
    </div>
  </div>
</template>
