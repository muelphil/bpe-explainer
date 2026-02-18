import { describe, it, expect, beforeEach } from 'vitest'
import { BPEService } from '../BPEService'

describe('BPEService', () => {
  let service: BPEService

  beforeEach(() => {
    service = new BPEService()
  })

  describe('Initialization', () => {
    it('should initialize with training data', () => {
      const trainingData = 'aaabdaaabac'
      service.initialize(trainingData)

      const state = service.getState()
      expect(state.trainingData).toBe(trainingData)
      expect(state.tokens.length).toBe(trainingData.length)
      expect(state.vocabulary.length).toBeGreaterThan(0)
    })

    it('should create vocabulary from unique characters', () => {
      service.initialize('abc', { initialVocab: 'characters' })
      
      const state = service.getState()
      expect(state.vocabulary.length).toBe(3)
      
      const contents = state.vocabulary.map(v => v.content).sort()
      expect(contents).toEqual(['a', 'b', 'c'])
    })
  })

  describe('Frequency Calculation', () => {
    it('should calculate pair frequencies correctly', () => {
      service.initialize('aaabdaaabac')
      
      const frequencies = service.calculateFrequencies()
      
      const aaPair = frequencies.find(f => f.pair[0] === 'a' && f.pair[1] === 'a')
      expect(aaPair).toBeDefined()
      expect(aaPair!.frequency).toBe(4)
    })
  })

  describe('Pair Merging', () => {
    it('should merge a pair and add to vocabulary', () => {
      service.initialize('aaabdaaabac')
      
      const initialVocabSize = service.getState().vocabulary.length
      const newEntry = service.mergePair(['a', 'a'])
      
      expect(newEntry.content).toBe('aa')
      expect(service.getState().vocabulary.length).toBe(initialVocabSize + 1)
    })

    it('should replace all occurrences of the pair', () => {
      service.initialize('aaaa')
      
      service.mergePair(['a', 'a'])
      
      const tokenContents = service.getState().tokens.map(t => t.content)
      expect(tokenContents).toEqual(['aa', 'aa'])
    })
  })

  describe('Step Navigation', () => {
    beforeEach(() => {
      service.initialize('aaabbb', { maxVocabSize: 10 })
    })

    it('should start at step 0', () => {
      expect(service.getState().currentStep).toBe(0)
    })

    it('should advance to next step', () => {
      service.nextStep()
      expect(service.getState().currentStep).toBe(1)
    })

    it('should go back to previous step', () => {
      service.nextStep()
      service.nextStep()
      service.previousStep()
      
      expect(service.getState().currentStep).toBe(1)
    })
  })

  describe('Compression Ratio', () => {
    it('should calculate compression ratio correctly', () => {
      service.initialize('aaaa')
      
      const initialRatio = service.getCompressionRatio()
      expect(initialRatio).toBe(1)
      
      service.mergePair(['a', 'a'])
      
      const afterMerge = service.getCompressionRatio()
      expect(afterMerge).toBe(2)
    })
  })
})
