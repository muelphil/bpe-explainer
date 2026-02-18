import { ref, computed } from 'vue'

/**
 * Composable for managing hover-based highlighting
 */
export function useHighlight() {
  const hoveredPair = ref<[string, string] | null>(null)
  const hoveredTokenContent = ref<string | null>(null)

  const isTokenHighlighted = (index: number, tokens: any[]) => {
    // Check if this token is part of a highlighted pair
    if (hoveredPair.value && index < tokens.length - 1) {
      const [token1, token2] = hoveredPair.value
      if (tokens[index].content === token1 && tokens[index + 1].content === token2) {
        return true
      }
      if (index > 0 && tokens[index - 1].content === token1 && tokens[index].content === token2) {
        return true
      }
    }

    // Check if this token matches hovered vocabulary token
    if (hoveredTokenContent.value) {
      return tokens[index].content === hoveredTokenContent.value
    }

    return false
  }

  const isPairHighlighted = (index: number, tokens: any[]) => {
    if (!hoveredPair.value || index >= tokens.length - 1) return false

    const [token1, token2] = hoveredPair.value
    return tokens[index].content === token1 && tokens[index + 1].content === token2
  }

  const setHoveredPair = (pair: [string, string] | null) => {
    hoveredPair.value = pair
    hoveredTokenContent.value = null // Clear other highlight type
  }

  const setHoveredTokenContent = (content: string | null) => {
    hoveredTokenContent.value = content
    hoveredPair.value = null // Clear other highlight type
  }

  const clearHighlight = () => {
    hoveredPair.value = null
    hoveredTokenContent.value = null
  }

  return {
    hoveredPair: computed(() => hoveredPair.value),
    hoveredTokenContent: computed(() => hoveredTokenContent.value),
    isTokenHighlighted,
    isPairHighlighted,
    setHoveredPair,
    setHoveredTokenContent,
    clearHighlight
  }
}
