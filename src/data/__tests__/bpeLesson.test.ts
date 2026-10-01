import { describe, expect, it } from 'vitest'
import { BPE_LESSONS, getLesson } from '../bpeLesson'
import type { Step } from '../../services/types'

const steps: Step[] = [
  { stepNumber: 0, type: 'tokenize', description: '', tokenCount: 10 },
  { stepNumber: 1, type: 'select', description: '', tokenCount: 10 },
  { stepNumber: 2, type: 'merge', description: '', tokenCount: 8 },
  { stepNumber: 3, type: 'complete', description: '', tokenCount: 8 },
]

describe('BPE lesson model', () => {
  it('defines a complete, uniquely identified narrative', () => {
    const ids = BPE_LESSONS.map(lesson => lesson.id)

    expect(ids).toHaveLength(8)
    expect(new Set(ids)).toHaveLength(ids.length)
    expect(BPE_LESSONS.every(lesson => lesson.articleId && lesson.target)).toBe(true)
  })

  it('resolves semantic lesson states from BPE history', () => {
    expect(getLesson('base-units').resolveStep(steps)).toBe(0)
    expect(getLesson('select-pair').resolveStep(steps)).toBe(1)
    expect(getLesson('merge-pair').resolveStep(steps)).toBe(2)
    expect(getLesson('validation').resolveStep(steps)).toBe(3)
  })

  it('gracefully handles an empty precomputed history', () => {
    expect(getLesson('base-units').resolveStep([])).toBeNull()
    expect(getLesson('validation').resolveStep([])).toBeNull()
  })
})
