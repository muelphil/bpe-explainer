import {reactive} from 'vue'
import type {BPEState, BPESettings, Token, VocabEntry, PairFrequency, Step} from './types'
import {getTokenColor} from '../utils/tokenColor'
import {canMergePair} from './mergeRestrictions'
import { SettingsService } from './SettingsService'

export class BPEService {
  private state: BPEState
  private nextTokenId = 0
  private nextVocabId = 0
  private playIntervalId: number | null = null
  // Cache for reconstructed steps (stepNumber -> {tokens, vocab})
  private stepCache = new Map<number, { tokens: Token[], vocab: VocabEntry[] }>()

  constructor() {
    // Load settings from localStorage
    const savedSettings = SettingsService.load()

    this.state = reactive({
      trainingData: '',
      tokens: [],
      vocabulary: [],
      currentStep: 0,
      steps: [],
      settings: savedSettings,
      frequencies: [],
      compressionRatio: 1,
      isPlaying: false,
      highlightedPairs: new Set(),
      highlightedTokenContent: null
    }) as BPEState

    // Apply settings (e.g., dark mode)
    SettingsService.apply(savedSettings)
  }

  getState(): BPEState {
    return this.state
  }

  /**
   * Update settings without re-initializing
   */
  updateSettings(settings: Partial<BPESettings>): void {
    Object.assign(this.state.settings, settings)
    // Save to localStorage
    SettingsService.save(this.state.settings)
    // Apply settings
    SettingsService.apply(this.state.settings)
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
   * Uses delta-based approach: only step 0 stores full snapshots,
   * subsequent steps store only the merge deltas
   */
  precomputeSteps(): void {
    const steps: Step[] = []

    // Step 0: Initial tokenization (full snapshot)
    const initialTokens = this.cloneTokens(this.state.tokens)
    steps.push({
      stepNumber: 0,
      type: 'tokenize',
      description: 'Initial tokenization complete',
      tokensSnapshot: initialTokens,
      vocabularySnapshot: this.cloneVocabulary(this.state.vocabulary),
      tokenCount: initialTokens.length
    })

    let stepNumber = 1

    // Create a working copy of state for computing steps
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
        const compressionRatio = this.state.trainingData.length / workingTokens.length
        const compressionPercentage = ((1 - 1 / compressionRatio) * 100).toFixed(1)

        // Determine stop reason
        let stopReason = ''
        if (this.state.settings.breakCondition === 'maxVocabSize' &&
            workingVocab.length >= this.state.settings.maxVocabSize) {
          stopReason = `Reached maximum vocabulary size (${this.state.settings.maxVocabSize})`
        } else if (this.state.settings.breakCondition === 'noFrequentPairs' ||
                   mostFrequent === null || mostFrequent.frequency === 1) {
          stopReason = 'All pairs have frequency 1'
        }

        // Complete step - no delta, as it doesn't change state
        steps.push({
          stepNumber,
          type: 'complete',
          description: `${stopReason}, Compression Rate: ${compressionPercentage}%`,
          tokenCount: workingTokens.length
        })
        break
      }

      // Selection step - no delta, as it doesn't change state
      const pair = mostFrequent.pair
      steps.push({
        stepNumber,
        type: 'select',
        description: `Select most frequent pair: "${pair[0]}" + "${pair[1]}" (frequency: ${mostFrequent.frequency})`,
        selectedPair: pair,
        highlightPair: pair, // Highlight the selected pair
        tokenCount: workingTokens.length
      })
      stepNumber++

      // Merge step - store delta (pair merged + vocab entry added)
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
            id: newVocabEntry.id,
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

      // Store merge step with delta information
      steps.push({
        stepNumber,
        type: 'merge',
        description: `Merged "${pair[0]}" + "${pair[1]}" → "${newContent}"`,
        selectedPair: pair,
        addedToken: newVocabEntry,
        // Delta fields for reconstruction
        mergedPair: pair,
        addedVocabEntry: {...newVocabEntry}, // Clone to avoid reference issues
        highlightTokenContent: newContent, // Highlight the newly merged token
        tokenCount: newTokens.length
      })
      stepNumber++

      workingTokens.splice(0, workingTokens.length, ...newTokens)
    }

    this.state.steps = steps
    
    // Clear cache since we have new steps
    this.stepCache.clear()
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

    // Reconstruct state from deltas
    const { tokens, vocab } = this.reconstructStep(stepNumber)
    this.state.tokens = tokens
    this.state.vocabulary = vocab

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
    this.stepCache.clear() // Clear reconstruction cache
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
    return tokens.map(t => ({...t}))
  }

  /**
   * Clone vocabulary array
   */
  private cloneVocabulary(vocab: VocabEntry[]): VocabEntry[] {
    return vocab.map(v => ({...v}))
  }

  /**
   * Apply a merge operation to a token array
   */
  private applyMerge(tokens: Token[], pair: [string, string], newVocabEntry: VocabEntry): Token[] {
    const [token1, token2] = pair
    const newTokens: Token[] = []
    let i = 0

    while (i < tokens.length) {
      if (
        i < tokens.length - 1 &&
        tokens[i].content === token1 &&
        tokens[i + 1].content === token2
      ) {
        // Merge this pair
        newTokens.push({
          id: newVocabEntry.id,
          content: newVocabEntry.content,
          color: newVocabEntry.color,
          skipAnimation: true
        })
        i += 2 // Skip both tokens
      } else {
        // Keep existing token
        newTokens.push({...tokens[i]})
        i++
      }
    }

    return newTokens
  }

  /**
   * Reconstruct state for a specific step using deltas
   * Uses caching with checkpoints every 20 steps for efficiency
   */
  private reconstructStep(targetStep: number): { tokens: Token[], vocab: VocabEntry[] } {
    // Check cache first - return a clone to avoid reference issues
    if (this.stepCache.has(targetStep)) {
      const cached = this.stepCache.get(targetStep)!
      return {
        tokens: this.cloneTokens(cached.tokens),
        vocab: this.cloneVocabulary(cached.vocab)
      }
    }

    // Step 0 always has full snapshot
    if (targetStep === 0) {
      const step0 = this.state.steps[0]
      const result = {
        tokens: this.cloneTokens(step0.tokensSnapshot!),
        vocab: this.cloneVocabulary(step0.vocabularySnapshot!)
      }
      // Cache step 0
      this.stepCache.set(0, {
        tokens: this.cloneTokens(result.tokens),
        vocab: this.cloneVocabulary(result.vocab)
      })
      return result
    }

    // Find the nearest checkpoint (every 20 steps or step 0)
    const CHECKPOINT_INTERVAL = 20
    let startStep = Math.floor(targetStep / CHECKPOINT_INTERVAL) * CHECKPOINT_INTERVAL
    
    // If checkpoint is not 0 and not cached, start from 0
    if (startStep > 0 && !this.stepCache.has(startStep)) {
      startStep = 0
    }

    // Get starting state (will return clones from cache)
    let { tokens, vocab } = startStep === 0 
      ? this.reconstructStep(0)
      : this.reconstructStep(startStep) // Use reconstructStep to get clones

    // Apply deltas from startStep+1 to targetStep
    for (let i = startStep + 1; i <= targetStep; i++) {
      const step = this.state.steps[i]
      
      if (step.type === 'merge' && step.mergedPair && step.addedVocabEntry) {
        // Add new vocab entry
        vocab.push({...step.addedVocabEntry})
        // Apply merge to tokens
        tokens = this.applyMerge(tokens, step.mergedPair, step.addedVocabEntry)
      }
      // Select and complete steps don't modify state, just provide context

      // Cache checkpoints
      if (i % CHECKPOINT_INTERVAL === 0) {
        this.stepCache.set(i, {
          tokens: this.cloneTokens(tokens),
          vocab: this.cloneVocabulary(vocab)
        })
      }
    }

    // Cache the final result
    this.stepCache.set(targetStep, {
      tokens: this.cloneTokens(tokens),
      vocab: this.cloneVocabulary(vocab)
    })

    // Limit cache size (keep last 10 accessed steps)
    if (this.stepCache.size > 10) {
      const sortedKeys = Array.from(this.stepCache.keys()).sort((a, b) => a - b)
      // Keep step 0 and recent steps
      const toKeep = new Set([0, ...sortedKeys.slice(-9)])
      for (const key of this.stepCache.keys()) {
        if (!toKeep.has(key)) {
          this.stepCache.delete(key)
        }
      }
    }

    return { tokens, vocab }
  }

  /**
   * Tokenize arbitrary input text using current vocabulary
   * Returns tokens or error markers for untokenizable characters
   */
  tokenizeInput(input: string): { tokens: Token[], hasErrors: boolean, compressionRatio: number } {
    if (!input) {
      return { tokens: [], hasErrors: false, compressionRatio: 1 }
    }

    const tokens: Token[] = []
    let hasErrors = false
    let position = 0

    // Greedy tokenization: try to match longest possible tokens from vocabulary
    while (position < input.length) {
      let matched = false

      // Try to find longest matching vocabulary entry starting at current position
      // Sort vocabulary by length (longest first) for greedy matching
      const sortedVocab = [...this.state.vocabulary].sort((a, b) => b.content.length - a.content.length)

      for (const vocabEntry of sortedVocab) {
        if (input.substring(position, position + vocabEntry.content.length) === vocabEntry.content) {
          // Found a match
          tokens.push({
            id: vocabEntry.id,
            content: vocabEntry.content,
            color: vocabEntry.color,
            skipAnimation: true
          })
          position += vocabEntry.content.length
          matched = true
          break
        }
      }

      if (!matched) {
        // Character not in vocabulary - add error token
        const char = input[position]
        if (char) {
          tokens.push({
            id: -1, // Error marker
            content: char,
            color: '#ef4444', // Red color for errors
            skipAnimation: true
          })
        }
        position++
        hasErrors = true
      }
    }

    const compressionRatio = input.length / tokens.length

    return { tokens, hasErrors, compressionRatio }
  }
}

// Singleton instance
export const bpeService = new BPEService()
