export interface Token {
  id: number
  content: string
  color: string
  skipAnimation?: boolean
}

export interface VocabEntry {
  id: number
  content: string
  color: string
  addedAtStep: number
}

export interface PairFrequency {
  pair: [string, string]
  frequency: number
  positions: number[][] // Array of [index1, index2] positions in tokens array
}

export interface Step {
  stepNumber: number
  type: 'tokenize' | 'select' | 'merge' | 'complete'
  description: string
  selectedPair?: [string, string]
  addedToken?: VocabEntry
  
  // Full snapshots (only for step 0)
  tokensSnapshot?: Token[]
  vocabularySnapshot?: VocabEntry[]
  
  // Delta information (for steps > 0)
  // For merge steps: which pair was merged and what vocab entry was added
  mergedPair?: [string, string]
  addedVocabEntry?: VocabEntry
  
  // Metadata (always present for easy access)
  tokenCount: number // Number of tokens at this step
  
  // Precomputed pair frequencies for this step (top 20, no positions needed for display)
  pairFrequencies?: Array<{pair: [string, string], frequency: number}>
  
  highlightPair?: [string, string] // Pair to highlight for this step (select/merge)
  highlightTokenContent?: string // Token content to highlight (for merged result)
}

export interface BPESettings {
  initialVocab: 'presentChars' | 'bytes'
  breakCondition: 'maxVocabSize' | 'noFrequentPairs' | 'compression'
  maxVocabSize: number
  targetCompressionRate: number // percentage 0-100
  playSpeed: number // milliseconds
  darkMode: boolean
  mergingRestriction: 'none' | 'llm' // 'llm' = spaces can only be joined to the right
}

export interface BPEState {
  trainingData: string
  tokens: Token[]
  vocabulary: VocabEntry[]
  currentStep: number
  steps: Step[]
  settings: BPESettings
  frequencies: PairFrequency[]
  compressionRatio: number
  isPlaying: boolean
  highlightedPairs: Set<string> // For hover highlighting, format: "token1|token2"
  highlightedTokenContent: string | null // For vocabulary hover
}
