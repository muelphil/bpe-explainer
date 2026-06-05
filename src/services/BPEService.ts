import {reactive, markRaw} from 'vue'
import type {BPEState, BPESettings, Token, VocabEntry, PairFrequency, Step} from './types'
import {getTokenColor} from '../utils/tokenColor'
import {canMergePair} from './mergeRestrictions'
import { SettingsService } from './SettingsService'

// ---------------------------------------------------------------------------
// Private types for precomputeSteps() incremental algorithm (Finding 2)
// ---------------------------------------------------------------------------
type PrecomputeNode = {
  content: string
  id: number
  color: string
  prev: PrecomputeNode | null
  next: PrecomputeNode | null
  deleted: boolean
}

type PrecomputeFreqEntry = {
  pair: [string, string]
  frequency: number
  /** Head node (left token) of each occurrence of this pair in the linked list. */
  headNodes: PrecomputeNode[]
}

// Maximum BPE iterations allowed regardless of break condition (Finding 8)
const MAX_ITERATIONS = 2_000

export class BPEService {
  private state: BPEState
  private nextTokenId = 0
  private nextVocabId = 0
  private playTimeoutId: number | null = null
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
    if (this.state.settings.initialVocab === 'unicodeChars') {
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
    // Build a Map for O(1) lookup instead of O(V) find() per character (Finding 5)
    const vocabMap = new Map<string, VocabEntry>()
    for (const entry of this.state.vocabulary) {
      vocabMap.set(entry.content, entry)
    }

    const tokens: Token[] = []
    // Use for...of to correctly iterate Unicode code points (not UTF-16 code units)
    for (const char of trainingData) {
      const vocabEntry = vocabMap.get(char)
      if (vocabEntry) {
        tokens.push({ id: vocabEntry.id, content: char, color: vocabEntry.color, skipAnimation: true })
      } else if (this.state.settings.initialVocab === 'bytes') {
        // Encode as UTF-8 bytes and map each byte to its vocabulary entry.
        const encoded = new TextEncoder().encode(char)
        for (const byte of encoded) {
          const byteChar = String.fromCharCode(byte)
          const byteEntry = vocabMap.get(byteChar)
          if (!byteEntry) {
            throw new Error(`Byte 0x${byte.toString(16)} not found in vocabulary`)
          }
          tokens.push({ id: byteEntry.id, content: byteChar, color: byteEntry.color, skipAnimation: true })
        }
      } else {
        throw new Error(`Character "${char}" not found in vocabulary`)
      }
    }
    this.state.tokens = tokens
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
      const token1 = this.state.tokens[i]!.content
      const token2 = this.state.tokens[i + 1]!.content

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
    return frequencies.length > 0 ? frequencies[0]! : null
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
        this.state.tokens[i]!.content === token1 &&
        this.state.tokens[i + 1]!.content === token2
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
        const token = this.state.tokens[i]
        if (token) newTokens.push(token)
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
    } else if (this.state.settings.breakCondition === 'compression') {
      const ratio = this.state.trainingData.length / this.state.tokens.length
      const compressionPct = (1 - 1 / ratio) * 100
      return compressionPct >= this.state.settings.targetCompressionRate
    } else {
      // noFrequentPairs: stop when all pairs have frequency of 1
      const mostFrequent = this.findMostFrequentPair()
      return mostFrequent === null || mostFrequent.frequency === 1
    }
  }

  /**
   * Precompute all steps for the algorithm.
   *
   * Uses a doubly-linked list + incremental frequency-map approach (Finding 2):
   * instead of rescanning all N tokens every step, only the O(occurrences)
   * pairs adjacent to each merge site are updated.  No full token array is
   * rebuilt per step; deltas are stored as (mergedPair, addedVocabEntry).
   */
  precomputeSteps(): void {
    const steps: Step[] = []
    const restriction = this.state.settings.mergingRestriction

    // Step 0: initial tokenization snapshot (full clone, done only once)
    const initialTokens = this.cloneTokens(this.state.tokens)
    steps.push({
      stepNumber: 0,
      type: 'tokenize',
      description: 'Initial tokenization complete',
      tokensSnapshot: initialTokens,
      vocabularySnapshot: this.cloneVocabulary(this.state.vocabulary),
      tokenCount: initialTokens.length
    })

    // ── Build doubly-linked list from initial tokens ──────────────────────────
    let listHead: PrecomputeNode | null = null
    let listTail: PrecomputeNode | null = null
    for (const token of this.state.tokens) {
      const node: PrecomputeNode = {
        content: token.content,
        id: token.id,
        color: token.color,
        prev: listTail,
        next: null,
        deleted: false
      }
      if (listTail) listTail.next = node
      else listHead = node
      listTail = node
    }

    // ── Working vocab: Map for O(1) lookup + size counter ────────────────────
    const workingVocabMap = new Map<string, VocabEntry>()
    for (const entry of this.state.vocabulary) {
      workingVocabMap.set(entry.content, entry)
    }
    let workingVocabSize = this.state.vocabulary.length

    // ── Build initial frequency map with headNodes ───────────────────────────
    // Each entry stores the head (left) node of every occurrence of that pair,
    // enabling targeted incremental updates instead of a full rescan.
    const freqMap = new Map<string, PrecomputeFreqEntry>()
    for (let node = listHead; node?.next; node = node.next) {
      if (!canMergePair(node.content, node.next.content, restriction)) continue
      const key = `${node.content}|${node.next.content}`
      const entry = freqMap.get(key)
      if (entry) {
        entry.frequency++
        entry.headNodes.push(node)
      } else {
        freqMap.set(key, { pair: [node.content, node.next.content], frequency: 1, headNodes: [node] })
      }
    }

    let tokenCount = this.state.tokens.length
    let stepNumber = 1
    let iteration = 0

    // Helper: snapshot the current freqMap into the compact format stored on steps
    const snapshotFreqMap = (): Array<{pair: [string, string], frequency: number}> =>
      Array.from(freqMap.values())
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 20)
        .map(e => ({ pair: e.pair, frequency: e.frequency }))

    // Attach initial frequencies to step 0
    steps[0]!.pairFrequencies = snapshotFreqMap()

    while (iteration < MAX_ITERATIONS) {
      // Find most frequent pair (linear scan of the map; map is much smaller than N)
      let maxEntry: PrecomputeFreqEntry | null = null
      for (const entry of freqMap.values()) {
        if (!maxEntry || entry.frequency > maxEntry.frequency) maxEntry = entry
      }

      // ── Check break conditions ─────────────────────────────────────────────
      const vocabFull =
        this.state.settings.breakCondition === 'maxVocabSize' &&
        workingVocabSize >= this.state.settings.maxVocabSize
      const noPairs =
        this.state.settings.breakCondition === 'noFrequentPairs' &&
        (maxEntry === null || maxEntry.frequency <= 1)
      const compressionReached = (() => {
        if (this.state.settings.breakCondition !== 'compression') return false
        const ratio = this.state.trainingData.length / tokenCount
        const pct = (1 - 1 / ratio) * 100
        return pct >= this.state.settings.targetCompressionRate
      })()
      const exhausted = maxEntry === null

      if (vocabFull || noPairs || compressionReached || exhausted) {
        const compressionRatio = this.state.trainingData.length / tokenCount
        const compressionPercentage = ((1 - 1 / compressionRatio) * 100).toFixed(1)
        let stopReason: string
        if (vocabFull) {
          stopReason = `Reached maximum vocabulary size (${this.state.settings.maxVocabSize})`
        } else if (compressionReached) {
          stopReason = `Reached target compression rate (${this.state.settings.targetCompressionRate}%)`
        } else if (iteration >= MAX_ITERATIONS) {
          stopReason = `Step limit reached (${MAX_ITERATIONS} iterations)`
        } else {
          stopReason = 'All pairs have frequency 1'
        }
        steps.push({
          stepNumber,
          type: 'complete',
          description: `${stopReason}, Compression Rate: ${compressionPercentage}%`,
          pairFrequencies: snapshotFreqMap(),
          tokenCount
        })
        break
      }

      const pair = maxEntry!.pair

      // ── Select step (reads state only, no mutation) ───────────────────────
      steps.push({
        stepNumber,
        type: 'select',
        description: `Select most frequent pair: "${pair[0]}" + "${pair[1]}" (frequency: ${maxEntry!.frequency})`,
        selectedPair: pair,
        highlightPair: pair,
        pairFrequencies: snapshotFreqMap(),
        tokenCount
      })
      stepNumber++

      // ── Get or create vocab entry for merged content ──────────────────────
      const newContent = pair[0] + pair[1]
      let newVocabEntry = workingVocabMap.get(newContent)
      if (!newVocabEntry) {
        newVocabEntry = {
          id: this.nextVocabId++,
          content: newContent,
          color: getTokenColor(newContent),
          addedAtStep: stepNumber
        }
        workingVocabMap.set(newContent, newVocabEntry)
        workingVocabSize++
      }

      // ── Incremental merge: update linked list + freq map ──────────────────
      const [A, B] = pair
      const abEntry = freqMap.get(`${A}|${B}`)!
      const headNodes = abEntry.headNodes.slice() // snapshot before mutation
      let mergeCount = 0

      for (const nodeA of headNodes) {
        // Node may have been consumed by a previous merge in this same pass
        // (possible when pair overlaps, e.g. (a,a) in [a,a,a])
        if (nodeA.deleted) continue
        const nodeB = nodeA.next
        if (!nodeB || nodeB.deleted || nodeB.content !== B) continue

        const prevNode = nodeA.prev
        const nextNode = nodeB.next

        // Remove left context pair (prevNode.content, A)
        if (prevNode && !prevNode.deleted) {
          const leftKey = `${prevNode.content}|${A}`
          const leftEntry = freqMap.get(leftKey)
          if (leftEntry) {
            leftEntry.frequency--
            const idx = leftEntry.headNodes.indexOf(prevNode)
            if (idx !== -1) leftEntry.headNodes.splice(idx, 1)
            if (leftEntry.frequency <= 0) freqMap.delete(leftKey)
          }
        }

        // Remove right context pair (B, nextNode.content)
        if (nextNode && !nextNode.deleted) {
          const rightKey = `${B}|${nextNode.content}`
          const rightEntry = freqMap.get(rightKey)
          if (rightEntry) {
            rightEntry.frequency--
            const idx = rightEntry.headNodes.indexOf(nodeB)
            if (idx !== -1) rightEntry.headNodes.splice(idx, 1)
            if (rightEntry.frequency <= 0) freqMap.delete(rightKey)
          }
        }

        // Create merged node and re-link
        const nodeAB: PrecomputeNode = {
          content: newContent,
          id: newVocabEntry.id,
          color: newVocabEntry.color,
          prev: prevNode,
          next: nextNode,
          deleted: false
        }
        if (prevNode) prevNode.next = nodeAB
        else listHead = nodeAB
        if (nextNode) nextNode.prev = nodeAB
        nodeA.deleted = true
        nodeB.deleted = true

        // Add new left context pair (prevNode.content, AB)
        if (prevNode && !prevNode.deleted && canMergePair(prevNode.content, newContent, restriction)) {
          const newLeftKey = `${prevNode.content}|${newContent}`
          const entry = freqMap.get(newLeftKey)
          if (entry) {
            entry.frequency++
            entry.headNodes.push(prevNode)
          } else {
            freqMap.set(newLeftKey, { pair: [prevNode.content, newContent], frequency: 1, headNodes: [prevNode] })
          }
        }

        // Add new right context pair (AB, nextNode.content)
        if (nextNode && !nextNode.deleted && canMergePair(newContent, nextNode.content, restriction)) {
          const newRightKey = `${newContent}|${nextNode.content}`
          const entry = freqMap.get(newRightKey)
          if (entry) {
            entry.frequency++
            entry.headNodes.push(nodeAB)
          } else {
            freqMap.set(newRightKey, { pair: [newContent, nextNode.content], frequency: 1, headNodes: [nodeAB] })
          }
        }

        mergeCount++
      }

      // Remove the fully-merged pair from the map
      freqMap.delete(`${A}|${B}`)
      tokenCount -= mergeCount

      // ── Merge step delta (only what's needed for reconstruction) ─────────
      steps.push({
        stepNumber,
        type: 'merge',
        description: `Merged "${A}" + "${B}" → "${newContent}"`,
        selectedPair: pair,
        addedToken: newVocabEntry,
        mergedPair: pair,
        addedVocabEntry: {...newVocabEntry},
        highlightTokenContent: newContent,
        pairFrequencies: snapshotFreqMap(),
        tokenCount
      })
      stepNumber++
      iteration++
    }

    // Handle MAX_ITERATIONS cap: push complete step if loop exited via counter
    if (iteration >= MAX_ITERATIONS && steps[steps.length - 1]?.type !== 'complete') {
      const compressionRatio = this.state.trainingData.length / tokenCount
      const compressionPercentage = ((1 - 1 / compressionRatio) * 100).toFixed(1)
      steps.push({
        stepNumber,
        type: 'complete',
        description: `Step limit reached (${MAX_ITERATIONS} iterations), Compression Rate: ${compressionPercentage}%`,
        pairFrequencies: snapshotFreqMap(),
        tokenCount
      })
    }

    // markRaw prevents Vue from deeply proxying the immutable steps array (Finding 9)
    this.state.steps = markRaw(steps)
    this.stepCache.clear()
  }

  /**
   * Calculate frequencies for a given token array (helper for precomputation)
   */
  private calculateFrequenciesForTokens(tokens: Token[]): PairFrequency[] {
    const frequencyMap = new Map<string, PairFrequency>()

    for (let i = 0; i < tokens.length - 1; i++) {
      const token1 = tokens[i]!.content
      const token2 = tokens[i + 1]!.content

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

    this.state.compressionRatio = tokens.length > 0 ? this.state.trainingData.length / tokens.length : 1
  }

  /**
   * Go to next step.
   *
   * Fast path for sequential forward navigation: applies the delta directly to
   * state.tokens and state.vocabulary without going through reconstructStep().
   * This eliminates the 3 O(N) token-array copies that reconstruction requires
   * (clone-from-cache → applyMerge → clone-for-cache).
   *
   * previousStep() still uses goToStep() with full reconstruction because it
   * is typically a manual action, not called in a tight loop.
   */
  nextStep(): void {
    const nextStepNumber = this.state.currentStep + 1
    if (nextStepNumber >= this.state.steps.length) return

    const step = this.state.steps[nextStepNumber]!
    this.state.currentStep = nextStepNumber

    if (step.type === 'merge' && step.mergedPair && step.addedVocabEntry) {
      // Append the new vocab entry (reactive push to keep change minimal)
      this.state.vocabulary.push({...step.addedVocabEntry})
      // Replace tokens array with merged result
      this.state.tokens = this.applyMerge(this.state.tokens, step.mergedPair, step.addedVocabEntry)
      this.state.compressionRatio =
        this.state.tokens.length > 0 ? this.state.trainingData.length / this.state.tokens.length : 1
      // Invalidate any stale cache entry for this step so jumping back then
      // forward produces a consistent result via reconstructStep.
      this.stepCache.delete(nextStepNumber)
    }
    // select / complete steps: no token/vocab state change needed
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
   * Start auto-playing through steps.
   *
   * Uses a self-rescheduling setTimeout chain instead of setInterval so that
   * the next step is only scheduled AFTER the current step (and any Vue
   * rendering it triggers) completes.  setInterval would fire at fixed wall-
   * clock intervals regardless of how long the previous step took, causing
   * multiple steps to pile up when reconstruction is slow.
   */
  play(): void {
    if (this.state.isPlaying) return

    this.state.isPlaying = true

    const scheduleNext = () => {
      this.playTimeoutId = window.setTimeout(() => {
        if (!this.state.isPlaying) return
        if (this.state.currentStep >= this.state.steps.length - 1) {
          this.pause()
          return
        }
        this.nextStep()
        scheduleNext() // schedule next only after this step has been applied
      }, this.state.settings.playSpeed)
    }

    scheduleNext()
  }

  /**
   * Pause auto-play
   */
  pause(): void {
    this.state.isPlaying = false
    if (this.playTimeoutId !== null) {
      clearTimeout(this.playTimeoutId)
      this.playTimeoutId = null
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
      const pairKey = `${this.state.tokens[i]!.content}|${this.state.tokens[i + 1]!.content}`
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
        tokens[i]!.content === token1 &&
        tokens[i + 1]!.content === token2
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
        newTokens.push({...tokens[i]!})
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
      const step0 = this.state.steps[0]!
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
      const step = this.state.steps[i]!

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
