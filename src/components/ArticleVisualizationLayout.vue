<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, BookOpen, FlaskConical } from 'lucide-vue-next'
import { useIsMobile } from '../composables/useIsMobile'

const { isMobile } = useIsMobile()

const STORAGE_KEY = 'articleCollapsed'

function readStateFromEnv(): boolean {
  const hash = window.location.hash
  if (hash === '#article') return true
  if (hash === '#app') return false

  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'true') return false
  if (stored === 'false') return true

  return true // default: open
}

// Initialize immediately (no onMounted) to avoid a visible layout jump
const isOpen = ref(readStateFromEnv())

function persistState(open: boolean) {
  localStorage.setItem(STORAGE_KEY, open ? 'false' : 'true')
  history.replaceState(null, '', open ? '#article' : '#app')
}

function open() {
  isOpen.value = true
  persistState(true)
}

function close() {
  isOpen.value = false
  persistState(false)
}

function handleHashChange() {
  const hash = window.location.hash
  if (hash === '#article') isOpen.value = true
  else if (hash === '#app') isOpen.value = false
}

onMounted(() => {
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <!-- Desktop: participates in flex-row, width transitions -->
  <template v-if="!isMobile">
    <!-- Wrapper: relative positioning for the floating close button, no overflow clipping -->
    <div
      class="article-panel-wrapper relative"
      :style="{ '--basis': isOpen ? 'var(--article-panel-basis)' : '0px', '--min': isOpen ? 'var(--article-panel-min)' : '0px', '--max': isOpen ? 'var(--article-panel-max)' : '0px' }"
    >
      <!-- Inner: overflow-hidden clips blog content during width transition -->
      <div class="article-panel-inner overflow-hidden border-r border-slate-200 dark:border-slate-700 h-full flex-shrink-0">
        <slot />
      </div>

      <!-- Collapse button: outside overflow-hidden, floats at right edge of wrapper -->
      <button
        v-if="isOpen"
        class="article-collapse-btn"
        aria-label="Collapse article"
        @click="close"
      >
        <ChevronLeft :size="18" />
      </button>
    </div>

    <!-- Expand button: shown when collapsed, fixed to left edge of viewport -->
    <div v-if="!isOpen" class="article-expand-btn-wrapper">
      <button
        class="article-expand-btn"
        aria-label="Open article"
        @click="open"
      >
        <BookOpen :size="18" class="flex-shrink-0" />
        <span class="article-expand-label">Learn More</span>
      </button>
    </div>
  </template>

  <!-- Mobile: absolute overlay, slides in from left -->
  <template v-else>
    <div
      class="article-mobile-panel absolute inset-0 z-50 overflow-hidden"
      :class="{ 'article-mobile-panel--open': isOpen }"
    >
      <slot />

      <!-- Close button: floating on right edge of overlay -->
      <button
        class="article-collapse-btn article-collapse-btn--mobile"
        aria-label="Open testing ground"
        @click="close"
      >
        <FlaskConical :size="18" />
      </button>
    </div>

    <!-- Expand button: shown when collapsed, fixed to left edge of viewport -->
    <div v-if="!isOpen" class="article-expand-btn-wrapper">
      <button
        class="article-expand-btn"
        aria-label="Open article"
        @click="open"
      >
        <BookOpen :size="18" class="flex-shrink-0" />
        <span class="article-expand-label">Learn More</span>
      </button>
    </div>
  </template>
</template>

<style scoped>
/* Desktop: wrapper transitions flex-basis (no overflow-hidden here so close button isn't clipped) */
.article-panel-wrapper {
  flex-basis: var(--basis);
  min-width: var(--min);
  max-width: var(--max);
  transition: flex-basis 250ms ease, min-width 250ms ease, max-width 250ms ease;
}

/* Inner panel: fills wrapper width */
.article-panel-inner {
  width: 100%;
}

/* Collapse button: circular, floats on right edge of panel */
.article-collapse-btn {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  box-shadow: 0 2px 8px var(--shadow-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-secondary);
  z-index: 10;
  transition: background-color 150ms ease, color 150ms ease;
}

.article-collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Mobile close button: vertically centered, anchored to right side of viewport */
.article-collapse-btn--mobile {
  position: fixed;
  right: 12px;
  left: auto;
  top: 50%;
  transform: translateY(-50%);
}

/* Expand button wrapper: fixed to left edge */
.article-expand-btn-wrapper {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 20;
}

/* Expand button: BookOpen icon, expands on hover to reveal "Learn More" */
.article-expand-btn {
  display: flex;
  align-items: center;
  gap: 0;
  height: 40px;
  border-radius: 0 20px 20px 0;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-left: none;
  box-shadow: 2px 2px 8px var(--shadow-color);
  cursor: pointer;
  color: var(--text-secondary);
  overflow: hidden;
  /* Start slightly off-screen so only partial circle protrudes */
  padding-left: 8px;
  padding-right: 10px;
  transition: padding-right 250ms ease, gap 250ms ease, background-color 150ms ease, color 150ms ease;
}

.article-expand-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  padding-right: 14px;
  gap: 8px;
}

/* "Learn More" text: hidden width, expands on hover */
.article-expand-label {
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 500;
  max-width: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-width 250ms ease, opacity 200ms ease;
}

.article-expand-btn:hover .article-expand-label {
  max-width: 100px;
  opacity: 1;
}

/* Mobile overlay panel */
.article-mobile-panel {
  background: var(--bg-primary);
  transform: translateX(-100%);
  transition: transform 250ms ease;
}

.article-mobile-panel--open {
  transform: translateX(0);
}
</style>
