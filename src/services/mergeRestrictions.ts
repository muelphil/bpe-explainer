/**
 * Merge restriction functions for BPE token pairing
 * These functions determine which token pairs can be merged based on different modes
 */

/**
 * None mode: No restrictions - any adjacent tokens can be merged
 */
export function canMergeNoneMode(token1: string, token2: string): boolean {
  return true // All pairs are allowed
}

/**
 * LLM mode: Mimics real LLM tokenizers with specific merging rules
 * 
 * Rules:
 * 1. Newlines can ONLY join with other newlines
 * 2. Spaces/tabs can join with other spaces/tabs (but not newlines)
 * 3. Pure numbers can ONLY join with pure numbers
 * 4. Pure letters can ONLY join with pure letters
 * 5. Pure symbols/punctuation can ONLY join with pure symbols/punctuation
 * 6. Mixed tokens (already merged, e.g., "hello123") can join with alphanumeric
 */
export function canMergeLLMMode(token1: string, token2: string): boolean {
  // Rule 1: Newlines can ONLY join with other newlines
  const token1HasNewline = token1.includes('\n')
  const token2HasNewline = token2.includes('\n')
  
  if (token1HasNewline || token2HasNewline) {
    // Both must consist ONLY of newlines (any number: \n, \n\n, etc.)
    const token1OnlyNewlines = /^[\n]+$/.test(token1)
    const token2OnlyNewlines = /^[\n]+$/.test(token2)
    return token1OnlyNewlines && token2OnlyNewlines
  }
  
  // Rule 2: Non-newline whitespace (spaces, tabs) can join together
  const isToken1Whitespace = /^[ \t]+$/.test(token1) // Only spaces/tabs, not newlines
  const isToken2Whitespace = /^[ \t]+$/.test(token2)
  
  if (isToken1Whitespace && isToken2Whitespace) {
    return true
  }
  
  // Classify tokens as pure numbers, pure letters, pure symbols, or mixed
  const token1IsPureNumber = /^[0-9]+$/.test(token1)
  const token2IsPureNumber = /^[0-9]+$/.test(token2)
  const token1IsPureLetter = /^[a-zA-Z]+$/.test(token1)
  const token2IsPureLetter = /^[a-zA-Z]+$/.test(token2)
  const token1IsPureSymbol = /^[^a-zA-Z0-9\s]+$/.test(token1) // Not alphanumeric, not whitespace
  const token2IsPureSymbol = /^[^a-zA-Z0-9\s]+$/.test(token2)
  
  // Rule 3: Pure numbers can only join with pure numbers
  if (token1IsPureNumber && !token2IsPureNumber) {
    return false
  }
  
  // Rule 4: Pure letters can only join with pure letters
  if (token1IsPureLetter && !token2IsPureLetter) {
    return false
  }
  
  // Rule 5: Pure symbols can only join with pure symbols
  if (token1IsPureSymbol && !token2IsPureSymbol) {
    return false
  }
  
  // If left token is whitespace (already handled above) or mixed,
  // right token must start with alphanumeric
  if (!token1IsPureNumber && !token1IsPureLetter && !token1IsPureSymbol) {
    // Left is whitespace or mixed token
    return /^[a-zA-Z0-9]/.test(token2)
  }
  
  // If we get here, both tokens are of the same pure type
  // (both numbers, both letters, or both symbols)
  return true
}

/**
 * Main function to check if two tokens can be merged based on the current mode
 */
export function canMergePair(
  token1: string, 
  token2: string, 
  mode: 'none' | 'llm'
): boolean {
  switch (mode) {
    case 'none':
      return canMergeNoneMode(token1, token2)
    case 'llm':
      return canMergeLLMMode(token1, token2)
    default:
      return canMergeNoneMode(token1, token2)
  }
}
