/**
 * Hash function to generate consistent colors with better distribution
 * Uses djb2 algorithm with bit mixing for better distribution
 */
export function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) + hash) + char // hash * 33 + char
  }
  // Mix the bits more to avoid similar adjacent values
  hash = hash ^ (hash >>> 16)
  hash = hash * 0x21f0aaad
  hash = hash ^ (hash >>> 15)
  hash = hash * 0x735a2d97
  hash = hash ^ (hash >>> 15)
  return Math.abs(hash)
}

/**
 * Generate a consistent color for a token based on its content
 * Uses golden ratio for better color distribution
 */
export function getTokenColor(content: string): string {
  const hash = hashString(content)
  // Use golden ratio for better color distribution
  const hue = (hash * 137.508) % 360
  const saturation = 55 + (hash % 30)
  const lightness = 70 + (hash % 20)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Display token content with special character visualization
 */
export function displayTokenContent(content: string): string {
  return content.replace(/ /g, '▁')
}
