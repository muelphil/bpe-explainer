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
      service.initialize('abc', { initialVocab: 'unicodeChars' })
      
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
      service.initialize('aaabbb', { 
        initialVocab: 'unicodeChars', 
        breakCondition: 'maxVocabSize',
        maxVocabSize: 10 
      })
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

  describe('LLM Merging Restrictions', () => {
    describe('None mode', () => {
      it('should allow all pairs including newlines with non-newlines', () => {
        const trainingData = 'a\nb c\nd'
        service.initialize(trainingData, { mergingRestriction: 'none' })

        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // Should allow mixing newlines with other tokens
        expect(pairStrings).toContain('a|\n')
        expect(pairStrings).toContain('\n|b')
      })
    })

    describe('LLM mode - newline restrictions', () => {
      it('should ONLY allow newlines to join with other newlines', () => {
        const trainingData = 'a\n\nb'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // Newline + newline should be allowed
        expect(pairStrings).toContain('\n|\n')

        // Newline should NOT be joinable with anything else
        const newlineWithNonNewline = frequencies.filter(f => 
          (f.pair[0].includes('\n') && f.pair[1] !== '\n') ||
          (f.pair[1].includes('\n') && f.pair[0] !== '\n')
        )
        expect(newlineWithNonNewline).toHaveLength(0)
      })

      it('should NOT allow space + newline', () => {
        const trainingData = 'a \nb'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // Space + newline should NOT be allowed in LLM mode
        expect(pairStrings).not.toContain(' |\n')
      })

      it('should NOT allow newline + space', () => {
        const trainingData = 'a\n b'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // Newline + space should NOT be allowed in LLM mode
        expect(pairStrings).not.toContain('\n| ')
      })

      it('should allow spaces to join with other spaces (but not newlines)', () => {
        const trainingData = 'a  b'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // Space + space should be allowed
        expect(pairStrings).toContain(' | ')
      })

      it('should not allow merged tokens containing newlines to join with anything except pure newlines', () => {
        const tokens = [
          { id: 1, content: '\n\n', color: '#000', skipAnimation: true },
          { id: 2, content: '\n', color: '#000', skipAnimation: true },
          { id: 3, content: 'a', color: '#000', skipAnimation: true }
        ]
        
        service.initialize('dummy', { mergingRestriction: 'llm' })
        service.getState().tokens = tokens
        
        const frequencies = service.calculateFrequencies()
        const pairStrings = frequencies.map(f => f.pair.join('|'))

        // \n\n + \n should be allowed (both are pure newlines)
        expect(pairStrings).toContain('\n\n|\n')

        // \n + a should NOT be allowed
        expect(pairStrings).not.toContain('\n|a')
      })

      it('should allow spaces and alphanumeric but not spaces and newlines', () => {
        const trainingData = 'hello world\ntest'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()

        for (const freq of frequencies) {
          const [left, right] = freq.pair
          
          // If either contains newline, both must be pure newlines
          if (left.includes('\n') || right.includes('\n')) {
            expect(left === '\n' && right === '\n').toBe(true)
          }
        }
      })
    })

    describe('LLM mode - punctuation and symbol restrictions', () => {
      it('should not allow joining with punctuation', () => {
        const trainingData = 'hello. world, test'
        service.initialize(trainingData, { mergingRestriction: 'llm' })

        const frequencies = service.calculateFrequencies()

        for (const freq of frequencies) {
          const right = freq.pair[1]
          const left = freq.pair[0]
          
          // Skip if both are whitespace (non-newline)
          if (/^\s+$/.test(left) && /^\s+$/.test(right) && !left.includes('\n') && !right.includes('\n')) {
            continue
          }
          
          // Skip if both are newlines
          if (left === '\n' && right === '\n') {
            continue
          }
          
          // Right token must start with alphanumeric
          expect(/^[a-zA-Z0-9]/.test(right)).toBe(true)
        }
      })
    })
  })
})
