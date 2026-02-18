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
  tokensSnapshot: Token[]
  vocabularySnapshot: VocabEntry[]
  highlightPair?: [string, string] // Pair to highlight for this step (select/merge)
  highlightTokenContent?: string // Token content to highlight (for merged result)
}

export interface BPESettings {
  initialVocab: 'characters' | 'bytes'
  breakCondition: 'maxVocabSize' | 'noFrequentPairs'
  maxVocabSize: number
  playSpeed: number // milliseconds
  darkMode: boolean
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
