import { ref } from 'vue'

const STORAGE_KEY = 'articleCollapsed'

function readState(): boolean {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash
    if (hash === '#article') return true
    if (hash === '#app') return false
  }
  if (typeof localStorage !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'true') return false
    if (stored === 'false') return true
  }
  return true // default: open
}

function persistState(open: boolean) {
  localStorage.setItem(STORAGE_KEY, open ? 'false' : 'true')
  history.replaceState(null, '', open ? '#article' : '#app')
}

export const articleOpenState = {
  isOpen: ref(readState()),
  persistState,
}
