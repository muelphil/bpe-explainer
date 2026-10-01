import type { Step } from '../services/types'

export type LessonId =
  | 'base-units'
  | 'count-pairs'
  | 'select-pair'
  | 'merge-pair'
  | 'vocabulary'
  | 'history'
  | 'validation'
  | 'explore'

export type GuideTarget =
  | 'corpus'
  | 'frequency'
  | 'vocabulary'
  | 'steps'
  | 'controls'
  | 'validation'

export interface BPELesson {
  id: LessonId
  title: string
  description: string
  action?: string
  target: GuideTarget
  articleId: string
  mode: 'training' | 'validation'
  resolveStep: (steps: Step[]) => number | null
}

const firstStepOfType = (steps: Step[], type: Step['type']): number | null =>
  steps.find(step => step.type === type)?.stepNumber ?? null

export const BPE_LESSONS: readonly BPELesson[] = [
  {
    id: 'base-units',
    title: 'Start with base units',
    description: 'Every colored chip is a token. Its small number is the token’s vocabulary ID.',
    target: 'corpus',
    articleId: 'lesson-base-units',
    mode: 'training',
    resolveStep: steps => steps[0]?.stepNumber ?? null,
  },
  {
    id: 'count-pairs',
    title: 'Count adjacent pairs',
    description: 'BPE counts neighboring token pairs. Hover a pair to reveal every place it occurs.',
    action: 'Hover the leading pair in the frequency panel.',
    target: 'frequency',
    articleId: 'lesson-count-pairs',
    mode: 'training',
    resolveStep: steps => steps[0]?.stepNumber ?? null,
  },
  {
    id: 'select-pair',
    title: 'Choose the most frequent pair',
    description: 'The pair with the highest count becomes the next learned merge rule.',
    target: 'frequency',
    articleId: 'lesson-select-pair',
    mode: 'training',
    resolveStep: steps => firstStepOfType(steps, 'select'),
  },
  {
    id: 'merge-pair',
    title: 'Merge every occurrence',
    description: 'The selected pair is replaced throughout the corpus by one newly learned token.',
    target: 'corpus',
    articleId: 'lesson-merge-pair',
    mode: 'training',
    resolveStep: steps => firstStepOfType(steps, 'merge'),
  },
  {
    id: 'vocabulary',
    title: 'Grow the vocabulary',
    description: 'The merged token enters the vocabulary and can now participate in later pairs.',
    action: 'Hover the newest vocabulary chip to find it in the corpus.',
    target: 'vocabulary',
    articleId: 'lesson-vocabulary',
    mode: 'training',
    resolveStep: steps => firstStepOfType(steps, 'merge'),
  },
  {
    id: 'history',
    title: 'Replay the learning history',
    description: 'Each row records a complete state. Click any row or use the transport controls to compare states.',
    target: 'steps',
    articleId: 'lesson-history',
    mode: 'training',
    resolveStep: steps => firstStepOfType(steps, 'merge'),
  },
  {
    id: 'validation',
    title: 'Apply the learned rules',
    description: 'Training is complete when the learned merge rules tokenize new input greedily, in order.',
    action: 'Try a suggested input, then inspect its nested merge structure.',
    target: 'validation',
    articleId: 'lesson-validation',
    mode: 'validation',
    resolveStep: steps => steps.length > 0 ? steps[steps.length - 1]!.stepNumber : null,
  },
  {
    id: 'explore',
    title: 'Make the tokenizer yours',
    description: 'Change the corpus, explore settings, or move through any step. Your experimentation is now independent.',
    target: 'controls',
    articleId: 'lesson-explore',
    mode: 'training',
    resolveStep: steps => firstStepOfType(steps, 'merge'),
  },
]

export const getLesson = (id: LessonId): BPELesson =>
  BPE_LESSONS.find(lesson => lesson.id === id) ?? BPE_LESSONS[0]!
