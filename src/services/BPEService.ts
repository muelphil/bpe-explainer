import { reactive } from 'vue'
import type { BPEState, BPESettings, Token, VocabEntry, PairFrequency, Step } from './types'
import { getTokenColor } from '../utils/tokenColor'
import { canMergePair } from './mergeRestrictions'

export class BPEService {
  private state: BPEState
  private nextTokenId = 0
  private nextVocabId = 0
  private playIntervalId: number | null = null

  constructor() {
    this.state = reactive({
      trainingData: '',
      tokens: [],
      vocabulary: [],
      currentStep: 0,
      steps: [],
      settings: {
        initialVocab: 'characters',
        breakCondition: 'maxVocabSize',
        maxVocabSize: 256,
        playSpeed: 500,
        darkMode: false,
        mergingRestriction: 'llm' // LLM mode is now the default
      },
      frequencies: [],
      compressionRatio: 1,
      isPlaying: false,
      highlightedPairs: new Set(),
      highlightedTokenContent: null
    }) as BPEState
  }

  getState(): BPEState {
    return this.state
  }

  /**
   * Initialize the BPE algorithm with training data
   */
  initialize(trainingData: string, settings?: Partial<BPESettings>): void {
    this.reset()
    
    if (settings) {
      Object.assign(this.state.settings, settings)
    }

    this.state.trainingData = trainingData
    
    // Create initial vocabulary
    this.createInitialVocabulary(trainingData)
    
    // Perform initial tokenization
    this.tokenizeTrainingData(trainingData)
    
    // Precompute all steps
    this.precomputeSteps()
    
    // Set to initial state (step 0)
    this.state.currentStep = 0
    this.updateFrequenciesAndCompression()
  }

  /**
   * Create initial vocabulary based on settings
   */
  private createInitialVocabulary(trainingData: string): void {
    if (this.state.settings.initialVocab === 'characters') {
      // Get unique characters from training data
      const uniqueChars = new Set(trainingData.split(''))
      uniqueChars.forEach(char => {
        this.state.vocabulary.push({
          id: this.nextVocabId++,
          content: char,
          color: getTokenColor(char),
          addedAtStep: 0
        })
      })
    } else {
      // All 256 bytes
      for (let i = 0; i < 256; i++) {
        const char = String.fromCharCode(i)
        this.state.vocabulary.push({
          id: this.nextVocabId++,
          content: char,
          color: getTokenColor(char),
          addedAtStep: 0
        })
      }
    }
  }

  /**
   * Tokenize training data into initial tokens
   */
  private tokenizeTrainingData(trainingData: string): void {
    this.state.tokens = trainingData.split('').map(char => {
      // Find the vocabulary entry for this character
      const vocabEntry = this.state.vocabulary.find(v => v.content === char)
      if (!vocabEntry) {
        throw new Error(`Character "${char}" not found in vocabulary`)
      }
      return {
        id: vocabEntry.id, // Use vocabulary ID, not sequential position
        content: char,
        color: vocabEntry.color,
        skipAnimation: true
      }
    })
  }

  /**
   * Get vocabulary entry by content, creating if needed
   */
  private getOrCreateVocabEntry(content: string, step: number): VocabEntry {
    let entry = this.state.vocabulary.find(v => v.content === content)
    if (!entry) {
      entry = {
        id: this.nextVocabId++,
        content: content,
        color: getTokenColor(content),
        addedAtStep: step
      }
      this.state.vocabulary.push(entry)
    }
    return entry
  }

  /**
   * Calculate frequencies of all adjacent token pairs
   */
  calculateFrequencies(): PairFrequency[] {
    const frequencyMap = new Map<string, PairFrequency>()

    for (let i = 0; i < this.state.tokens.length - 1; i++) {
      const token1 = this.state.tokens[i].content
      const token2 = this.state.tokens[i + 1].content
      
      // Check if this pair can be merged based on current restriction mode
      if (!canMergePair(token1, token2, this.state.settings.mergingRestriction)) {
        continue
      }
      
      const pairKey = `${token1}|${token2}`

      if (frequencyMap.has(pairKey)) {
        const entry = frequencyMap.get(pairKey)!
        entry.frequency++
        entry.positions.push([i, i + 1])
      } else {
        frequencyMap.set(pairKey, {
          pair: [token1, token2],
          frequency: 1,
          positions: [[i, i + 1]]
        })
      }
    }

    // Convert to array and sort by frequency (descending)
    return Array.from(frequencyMap.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Find the most frequent token pair
   */
  findMostFrequentPair(): PairFrequency | null {
    const frequencies = this.calculateFrequencies()
    return frequencies.length > 0 ? frequencies[0] : null
  }

  /**
   * Merge all occurrences of a specific token pair
   */
  mergePair(pair: [string, string]): VocabEntry {
    const [token1, token2] = pair
    const newContent = token1 + token2
    
    // Get or create vocabulary entry
    const newVocabEntry = this.getOrCreateVocabEntry(newContent, this.state.currentStep + 1)

    // Replace all occurrences in tokens array
    const newTokens: Token[] = []
    let i = 0

    while (i < this.state.tokens.length) {
      if (
        i < this.state.tokens.length - 1 &&
        this.state.tokens[i].content === token1 &&
        this.state.tokens[i + 1].content === token2
      ) {
        // Merge this pair
        newTokens.push({
          id: newVocabEntry.id, // Use vocabulary ID
          content: newContent,
          color: newVocabEntry.color,
          skipAnimation: true
        })
        i += 2 // Skip both tokens
      } else {
        // Ensure existing token uses vocabulary ID
        const currentToken = this.state.tokens[i]
        const vocabEntry = this.state.vocabulary.find(v => v.content === currentToken.content)
        if (vocabEntry && currentToken) {
          newTokens.push({
            ...currentToken,
            id: vocabEntry.id
          })
        } else if (currentToken) {
          newTokens.push(currentToken)
        }
        i++
      }
    }

    this.state.tokens = newTokens
    return newVocabEntry
  }

  /**
   * Check if break condition is reached
   */
  private shouldStop(): boolean {
    if (this.state.settings.breakCondition === 'maxVocabSize') {
      return this.state.vocabulary.length >= this.state.settings.maxVocabSize
    } else {
      // noFrequentPairs: stop when all pairs have frequency of 1
      const mostFrequent = this.findMostFrequentPair()
      return mostFrequent === null || mostFrequent.frequency === 1
    }
  }

  /**
   * Precompute all steps for the algorithm
   */
  precomputeSteps(): void {
    const steps: Step[] = []

    // Step 0: Initial tokenization
    steps.push({
      stepNumber: 0,
      type: 'tokenize',
      description: 'Initial tokenization complete',
      tokensSnapshot: this.cloneTokens(this.state.tokens),
      vocabularySnapshot: this.cloneVocabulary(this.state.vocabulary)
    })

    let stepNumber = 1
    
    // Create a working copy of state
    const workingTokens = this.cloneTokens(this.state.tokens)
    const workingVocab = this.cloneVocabulary(this.state.vocabulary)
    
    while (true) {
      // Calculate frequencies on working copy
      const frequencies = this.calculateFrequenciesForTokens(workingTokens)
      const mostFrequent = frequencies.length > 0 ? frequencies[0] : null

      // Check break condition
      const shouldStop = 
        (this.state.settings.breakCondition === 'maxVocabSize' && 
         workingVocab.length >= this.state.settings.maxVocabSize) ||
        (this.state.settings.breakCondition === 'noFrequentPairs' && 
         (mostFrequent === null || mostFrequent.frequency === 1))

      if (shouldStop || mostFrequent === null) {
        steps.push({
          stepNumber,
          type: 'complete',
          description: 'Algorithm complete',
          tokensSnapshot: this.cloneTokens(workingTokens),
          vocabularySnapshot: this.cloneVocabulary(workingVocab)
        })
        break
      }

      // Selection step
      const pair = mostFrequent.pair
      steps.push({
        stepNumber,
        type: 'select',
        description: `Select most frequent pair: "${pair[0]}" + "${pair[1]}" (frequency: ${mostFrequent.frequency})`,
        selectedPair: pair,
        tokensSnapshot: this.cloneTokens(workingTokens),
        vocabularySnapshot: this.cloneVocabulary(workingVocab),
        highlightPair: pair // Highlight the selected pair
      })
      stepNumber++

      // Merge step
      const newContent = pair[0] + pair[1]
      
      // Get or create vocabulary entry
      let newVocabEntry = workingVocab.find(v => v.content === newContent)
      if (!newVocabEntry) {
        newVocabEntry = {
          id: this.nextVocabId++,
          content: newContent,
          color: getTokenColor(newContent),
          addedAtStep: stepNumber
        }
        workingVocab.push(newVocabEntry)
      }

      // Perform merge on working tokens
      const newTokens: Token[] = []
      let i = 0
      while (i < workingTokens.length) {
        if (
          i < workingTokens.length - 1 &&
          workingTokens[i].content === pair[0] &&
          workingTokens[i + 1].content === pair[1]
        ) {
          newTokens.push({
            id: newVocabEntry.id, // Use vocabulary ID
            content: newContent,
            color: newVocabEntry.color,
            skipAnimation: true
          })
          i += 2
        } else {
          // Ensure token uses vocabulary ID
          const currentToken = workingTokens[i]
          const vocabEntry = workingVocab.find(v => v.content === currentToken.content)
          if (vocabEntry && currentToken) {
            newTokens.push({
              ...currentToken,
              id: vocabEntry.id
            })
          } else if (currentToken) {
            newTokens.push(currentToken)
          }
          i++
        }
      }

      steps.push({
        stepNumber,
        type: 'merge',
        description: `Merged "${pair[0]}" + "${pair[1]}" → "${newContent}"`,
        addedToken: newVocabEntry,
        tokensSnapshot: this.cloneTokens(newTokens),
        vocabularySnapshot: this.cloneVocabulary(workingVocab),
        highlightTokenContent: newContent // Highlight the newly merged token
      })
      stepNumber++

      workingTokens.splice(0, workingTokens.length, ...newTokens)
    }

    this.state.steps = steps
  }

  /**
   * Calculate frequencies for a given token array (helper for precomputation)
   */
  private calculateFrequenciesForTokens(tokens: Token[]): PairFrequency[] {
    const frequencyMap = new Map<string, PairFrequency>()

    for (let i = 0; i < tokens.length - 1; i++) {
      const token1 = tokens[i].content
      const token2 = tokens[i + 1].content
      
      // Check if this pair can be merged based on current restriction mode
      if (!canMergePair(token1, token2, this.state.settings.mergingRestriction)) {
        continue
      }
      
      const pairKey = `${token1}|${token2}`

      if (frequencyMap.has(pairKey)) {
        const entry = frequencyMap.get(pairKey)!
        entry.frequency++
        entry.positions.push([i, i + 1])
      } else {
        frequencyMap.set(pairKey, {
          pair: [token1, token2],
          frequency: 1,
          positions: [[i, i + 1]]
        })
      }
    }

    return Array.from(frequencyMap.values())
      .sort((a, b) => b.frequency - a.frequency)
  }

  /**
   * Go to a specific step
   */
  goToStep(stepNumber: number): void {
    if (stepNumber < 0 || stepNumber >= this.state.steps.length) {
      return
    }

    this.state.currentStep = stepNumber
    const step = this.state.steps[stepNumber]

    // Restore state from snapshot
    this.state.tokens = this.cloneTokens(step.tokensSnapshot)
    this.state.vocabulary = this.cloneVocabulary(step.vocabularySnapshot)

    this.updateFrequenciesAndCompression()
  }

  /**
   * Go to next step
   */
  nextStep(): void {
    if (this.state.currentStep < this.state.steps.length - 1) {
      this.goToStep(this.state.currentStep + 1)
    }
  }

  /**
   * Go to previous step
   */
  previousStep(): void {
    if (this.state.currentStep > 0) {
      this.goToStep(this.state.currentStep - 1)
    }
  }

  /**
   * Start auto-playing through steps
   */
  play(): void {
    if (this.state.isPlaying) return

    this.state.isPlaying = true
    this.playIntervalId = window.setInterval(() => {
      if (this.state.currentStep >= this.state.steps.length - 1) {
        this.pause()
      } else {
        this.nextStep()
      }
    }, this.state.settings.playSpeed)
  }

  /**
   * Pause auto-play
   */
  pause(): void {
    this.state.isPlaying = false
    if (this.playIntervalId !== null) {
      clearInterval(this.playIntervalId)
      this.playIntervalId = null
    }
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.pause()
    this.state.trainingData = ''
    this.state.tokens = []
    this.state.vocabulary = []
    this.state.currentStep = 0
    this.state.steps = []
    this.state.frequencies = []
    this.state.compressionRatio = 1
    this.state.highlightedPairs.clear()
    this.state.highlightedTokenContent = null
    this.nextTokenId = 0
    this.nextVocabId = 0
  }

  /**
   * Get compression ratio (original tokens / current tokens)
   */
  getCompressionRatio(): number {
    const originalLength = this.state.trainingData.length
    const currentLength = this.state.tokens.length
    return currentLength > 0 ? originalLength / currentLength : 1
  }

  /**
   * Update frequencies and compression ratio
   */
  private updateFrequenciesAndCompression(): void {
    this.state.frequencies = this.calculateFrequencies()
    this.state.compressionRatio = this.getCompressionRatio()
  }

  /**
   * Highlight pairs for hover interaction
   */
  highlightPair(pair: [string, string] | null): void {
    this.state.highlightedPairs.clear()
    if (pair) {
      this.state.highlightedPairs.add(`${pair[0]}|${pair[1]}`)
    }
  }

  /**
   * Highlight token content for vocabulary hover
   */
  highlightTokenContent(content: string | null): void {
    this.state.highlightedTokenContent = content
  }

  /**
   * Get positions of highlighted pairs in token array
   */
  getHighlightedPositions(): number[][] {
    const positions: number[][] = []
    
    for (let i = 0; i < this.state.tokens.length - 1; i++) {
      const pairKey = `${this.state.tokens[i].content}|${this.state.tokens[i + 1].content}`
      if (this.state.highlightedPairs.has(pairKey)) {
        positions.push([i, i + 1])
      }
    }

    return positions
  }

  /**
   * Clone tokens array
   */
  private cloneTokens(tokens: Token[]): Token[] {
    return tokens.map(t => ({ ...t }))
  }

  /**
   * Clone vocabulary array
   */
  private cloneVocabulary(vocab: VocabEntry[]): VocabEntry[] {
    return vocab.map(v => ({ ...v }))
  }
}

// Singleton instance
export const bpeService = new BPEService()
