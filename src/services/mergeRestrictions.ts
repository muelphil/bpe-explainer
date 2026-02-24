/**
 * Merge restriction functions for BPE token pairing
 * These functions determine which token pairs can be merged based on different modes
 */

// ---------------------------------------------------------------------------
// Token-type cache (Finding 3)
// ---------------------------------------------------------------------------
// Each unique token content is classified once and stored here, replacing
// repeated regex calls (4–7 per pair) with a single Map lookup.

const enum TT {
  Newline   = 0,
  Whitespace = 1,
  Number    = 2,
  Letter    = 3,
  Symbol    = 4,
  Mixed     = 5,
}

type TokenTypeInfo = {
  t: TT
  /** Whether the content starts with an ASCII letter or digit. */
  startsAlpha: boolean
}

const tokenTypeCache = new Map<string, TokenTypeInfo>()

function getTokenTypeInfo(content: string): TokenTypeInfo {
  const cached = tokenTypeCache.get(content)
  if (cached !== undefined) return cached

  let t: TT
  if (/^[\n]+$/.test(content))             t = TT.Newline
  else if (/^[ \t]+$/.test(content))       t = TT.Whitespace
  else if (/^[0-9]+$/.test(content))       t = TT.Number
  else if (/^[a-zA-Z]+$/.test(content))    t = TT.Letter
  else if (/^[^a-zA-Z0-9\s]+$/.test(content)) t = TT.Symbol
  else                                     t = TT.Mixed

  const info: TokenTypeInfo = { t, startsAlpha: /^[a-zA-Z0-9]/.test(content) }
  tokenTypeCache.set(content, info)
  return info
}

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
  const { t: t1 } = getTokenTypeInfo(token1)
  const { t: t2, startsAlpha: t2StartsAlpha } = getTokenTypeInfo(token2)

  // Rule 1: Newlines can ONLY join with other newlines
  if (t1 === TT.Newline || t2 === TT.Newline) {
    return t1 === TT.Newline && t2 === TT.Newline
  }

  // Rule 2: Whitespace handling
  if (t1 === TT.Whitespace) {
    if (token1.length > 1 && t2 !== TT.Whitespace) return false
    if (t2 === TT.Whitespace) return true
    // single-char whitespace + non-whitespace falls through to mixed rule
  }
  if (t2 === TT.Whitespace) return false // non-whitespace left + whitespace right

  // Rule 3: Pure numbers can only join with pure numbers
  if (t1 === TT.Number) return t2 === TT.Number

  // Rule 4: Pure letters can only join with pure letters
  if (t1 === TT.Letter) return t2 === TT.Letter

  // Rule 5: Pure symbols can only join with pure symbols
  if (t1 === TT.Symbol) return t2 === TT.Symbol

  // Left is whitespace (single-char, fell through) or mixed:
  // right token must start with alphanumeric
  return t2StartsAlpha
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
