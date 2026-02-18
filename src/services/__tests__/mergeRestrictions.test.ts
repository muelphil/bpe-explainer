import { describe, it, expect } from 'vitest'
import { canMergeNoneMode, canMergeLLMMode, canMergePair } from '../mergeRestrictions'

describe('Merge Restrictions', () => {
  describe('None Mode', () => {
    it('should allow any token pair to merge', () => {
      expect(canMergeNoneMode('a', 'b')).toBe(true)
      expect(canMergeNoneMode('1', '2')).toBe(true)
      expect(canMergeNoneMode('a', '1')).toBe(true)
      expect(canMergeNoneMode('\n', ' ')).toBe(true)
      expect(canMergeNoneMode('hello', '.')).toBe(true)
      expect(canMergeNoneMode(' ', '\n')).toBe(true)
    })
  })

  describe('LLM Mode - Newline Restrictions', () => {
    it('should allow newlines to join with other newlines', () => {
      expect(canMergeLLMMode('\n', '\n')).toBe(true)
      expect(canMergeLLMMode('\n\n', '\n')).toBe(true)
      expect(canMergeLLMMode('\n', '\n\n\n')).toBe(true)
    })

    it('should NOT allow newlines to join with spaces', () => {
      expect(canMergeLLMMode('\n', ' ')).toBe(false)
      expect(canMergeLLMMode(' ', '\n')).toBe(false)
      expect(canMergeLLMMode('\n\n', ' ')).toBe(false)
    })

    it('should NOT allow newlines to join with text', () => {
      expect(canMergeLLMMode('\n', 'a')).toBe(false)
      expect(canMergeLLMMode('a', '\n')).toBe(false)
      expect(canMergeLLMMode('\n\n', 'hello')).toBe(false)
    })

    it('should NOT allow newlines to join with numbers', () => {
      expect(canMergeLLMMode('\n', '1')).toBe(false)
      expect(canMergeLLMMode('123', '\n')).toBe(false)
    })
  })

  describe('LLM Mode - Whitespace Restrictions', () => {
    it('should allow spaces to join with other spaces', () => {
      expect(canMergeLLMMode(' ', ' ')).toBe(true)
      expect(canMergeLLMMode('  ', ' ')).toBe(true)
    })

    it('should allow tabs to join with spaces', () => {
      expect(canMergeLLMMode('\t', ' ')).toBe(true)
      expect(canMergeLLMMode(' ', '\t')).toBe(true)
      expect(canMergeLLMMode('\t', '\t')).toBe(true)
    })

    it('should allow spaces to join with alphanumeric on right', () => {
      expect(canMergeLLMMode(' ', 'h')).toBe(true)
      expect(canMergeLLMMode(' ', '1')).toBe(true)
      expect(canMergeLLMMode('  ', 'hello')).toBe(true)
    })
  })

  describe('LLM Mode - Number/Letter Separation', () => {
    it('should allow numbers to join with other numbers', () => {
      expect(canMergeLLMMode('1', '2')).toBe(true)
      expect(canMergeLLMMode('12', '3')).toBe(true)
      expect(canMergeLLMMode('999', '000')).toBe(true)
    })

    it('should allow letters to join with other letters', () => {
      expect(canMergeLLMMode('h', 'e')).toBe(true)
      expect(canMergeLLMMode('hello', 'world')).toBe(true)
      expect(canMergeLLMMode('a', 'B')).toBe(true)
    })

    it('should NOT allow numbers to join with letters', () => {
      expect(canMergeLLMMode('1', 'a')).toBe(false)
      expect(canMergeLLMMode('123', 'abc')).toBe(false)
      expect(canMergeLLMMode('9', 'z')).toBe(false)
    })

    it('should NOT allow letters to join with numbers', () => {
      expect(canMergeLLMMode('a', '1')).toBe(false)
      expect(canMergeLLMMode('hello', '123')).toBe(false)
      expect(canMergeLLMMode('Z', '9')).toBe(false)
    })

    it('should allow mixed tokens (already merged) to continue merging', () => {
      // Token "hello123" (already merged) can join with "world456"
      expect(canMergeLLMMode('hello123', 'world456')).toBe(true)
      // Token "abc123" can join with more alphanumeric
      expect(canMergeLLMMode('abc123', 'def')).toBe(true)
      expect(canMergeLLMMode('abc123', '789')).toBe(true)
    })
  })

  describe('LLM Mode - Punctuation and Symbol Restrictions', () => {
    it('should allow symbols to join with other symbols', () => {
      expect(canMergeLLMMode('.', ',')).toBe(true)
      expect(canMergeLLMMode('!', '?')).toBe(true)
      expect(canMergeLLMMode('$', '@')).toBe(true)
      expect(canMergeLLMMode('...', '!!!')).toBe(true)
    })

    it('should NOT allow symbols to join with numbers', () => {
      expect(canMergeLLMMode('$', '2')).toBe(false)
      expect(canMergeLLMMode('.', '1')).toBe(false)
      expect(canMergeLLMMode('!', '9')).toBe(false)
    })

    it('should NOT allow symbols to join with letters', () => {
      expect(canMergeLLMMode('.', 'c')).toBe(false)
      expect(canMergeLLMMode('$', 'a')).toBe(false)
      expect(canMergeLLMMode('!', 'hello')).toBe(false)
    })

    it('should NOT allow numbers to join with symbols', () => {
      expect(canMergeLLMMode('1', '.')).toBe(false)
      expect(canMergeLLMMode('123', '$')).toBe(false)
    })

    it('should NOT allow letters to join with symbols', () => {
      expect(canMergeLLMMode('hello', '.')).toBe(false)
      expect(canMergeLLMMode('world', ',')).toBe(false)
      expect(canMergeLLMMode('test', '!')).toBe(false)
    })

    it('should allow mixed tokens to join with alphanumeric', () => {
      // Mixed tokens (already merged like "hello123") can continue
      expect(canMergeLLMMode('hello123', 'world')).toBe(true)
      expect(canMergeLLMMode('abc123', '789')).toBe(true)
    })
  })

  describe('canMergePair - Mode Selector', () => {
    it('should route to none mode correctly', () => {
      expect(canMergePair('a', '\n', 'none')).toBe(true)
      expect(canMergePair('1', 'a', 'none')).toBe(true)
    })

    it('should route to llm mode correctly', () => {
      expect(canMergePair('a', '\n', 'llm')).toBe(false)
      expect(canMergePair('1', 'a', 'llm')).toBe(false)
      expect(canMergePair('1', '2', 'llm')).toBe(true)
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle typical text with numbers correctly', () => {
      // "hello123world" - in LLM mode
      // "hello" + "123" -> NO
      expect(canMergeLLMMode('hello', '123')).toBe(false)
      // "hello" + "world" -> YES
      expect(canMergeLLMMode('hello', 'world')).toBe(true)
      // "1" + "2" + "3" -> YES, YES
      expect(canMergeLLMMode('1', '2')).toBe(true)
      expect(canMergeLLMMode('12', '3')).toBe(true)
    })

    it('should handle code with mixed content', () => {
      // "function123()" in LLM mode
      // "function" + "123" -> NO (letter + number)
      expect(canMergeLLMMode('function', '123')).toBe(false)
      // "123" + "(" -> NO (number + symbol)
      expect(canMergeLLMMode('123', '(')).toBe(false)
      // "(" + ")" -> YES (symbol + symbol)
      expect(canMergeLLMMode('(', ')')).toBe(true)
    })

    it('should prevent $2d pattern', () => {
      // This was the bug: "$" + "2" should NOT be allowed
      expect(canMergeLLMMode('$', '2')).toBe(false)
      // And "2" + "d" should NOT be allowed
      expect(canMergeLLMMode('2', 'd')).toBe(false)
    })

    it('should handle multiline text properly', () => {
      // "hello\n\nworld" in LLM mode
      expect(canMergeLLMMode('hello', '\n')).toBe(false)
      expect(canMergeLLMMode('\n', '\n')).toBe(true)
      expect(canMergeLLMMode('\n\n', 'world')).toBe(false)
    })

    it('should allow pure symbol sequences', () => {
      // "..." or "!!!" or "---"
      expect(canMergeLLMMode('.', '.')).toBe(true)
      expect(canMergeLLMMode('..', '.')).toBe(true)
      expect(canMergeLLMMode('!', '!')).toBe(true)
      expect(canMergeLLMMode('-', '-')).toBe(true)
    })
  })
})
