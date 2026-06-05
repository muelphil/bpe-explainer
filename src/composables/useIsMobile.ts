import { ref, onMounted, onUnmounted } from 'vue'

const MOBILE_BREAKPOINT = '(max-width: 875px)'

export function useIsMobile() {
  const isMobile = ref(
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_BREAKPOINT).matches
      : false
  )

  let mediaQuery: MediaQueryList | null = null

  const handleChange = (e: MediaQueryListEvent) => {
    isMobile.value = e.matches
  }

  onMounted(() => {
    if (typeof window.matchMedia !== 'function') return
    mediaQuery = window.matchMedia(MOBILE_BREAKPOINT)
    isMobile.value = mediaQuery.matches
    mediaQuery.addEventListener('change', handleChange)
  })

  onUnmounted(() => {
    mediaQuery?.removeEventListener('change', handleChange)
  })

  return { isMobile }
}
