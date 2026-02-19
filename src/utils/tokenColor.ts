/**
 * djb2 hash function with bit mixing for better distribution
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    // djb2 algorithm with bit mixing
    hash = ((hash << 5) + hash) ^ char
    // Additional mixing to improve distribution
    hash = hash >>> 0 // Convert to unsigned 32-bit integer
    hash = (hash * 0x9e3779b9) >>> 0 // Golden ratio multiplication
  }
  return hash
}

/**
 * Generate a deterministic color for a token using hashing
 * Uses golden ratio (137.508 degrees) for hue distribution to ensure distinct colors
 *
 * Set USE_RANDOM_COLORS to true to enable colorful tokens
 */
const USE_RANDOM_COLORS = false // Set to true to enable random colors

export function getTokenColor(content: string): string {
  if (!USE_RANDOM_COLORS) {
    // Uniform color for all tokens
    return 'rgb(203, 213, 225)' // slate-300
  }

  // Random color based on content hash
  const hash = hashString(content)

  // Use golden ratio (137.508 degrees) for hue distribution
  // This ensures maximum distinction between similar token IDs
  const goldenRatioConjugate = 0.618033988749895
  const hue = (hash * goldenRatioConjugate * 360) % 360

  // Use consistent saturation and lightness for readability
  const saturation = 65
  const lightness = 75

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

/**
 * Display token content with special characters visualized
 * - Spaces shown as underscore (▁)
 * - Newlines shown as \n
 * - Tabs shown as \t
 * - Carriage returns shown as \r
 */
export function displayTokenContent(content: string): string {
  return content
    .replace(/[\x00-\x1F]/g, (char) => {
      switch (char) {
        case '\n': return '\\n'
        case '\t': return '\\t'
        case '\r': return '\\r'
        default:
          return `\\x${char.charCodeAt(0).toString(16).padStart(2, '0')}`
      }
    })
    .replace(/ /g, '▁')
}
