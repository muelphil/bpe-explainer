export type TourTarget =
  | 'main'
  | 'vocabulary'
  | 'frequency'
  | 'steps'
  | 'controls'
  | 'mode-training-data'
  | 'mode-validation'

export type TourPanel = 'vocabulary' | 'frequency' | 'steps'
export type TourMode = 'training' | 'training-data' | 'validation'

export interface TourStep {
  id: string
  title: string
  /** Trusted, static HTML (only <strong>) rendered via v-html */
  body: string
  /** Matches a `data-tour` attribute in the DOM */
  target: TourTarget
  /** Panel to expand (others collapse). `null` collapses all; `undefined` leaves panels untouched. */
  expand?: TourPanel | null
  /** Override of `expand` on mobile, where expanded panels hide the token view */
  mobileExpand?: TourPanel | null
  mode: TourMode
  /** Further element to leave undimmed by the spotlight (no border) */
  unobscured?: TourTarget[]
}

export const TOUR_TARGETS: readonly TourTarget[] = [
  'main', 'vocabulary', 'frequency', 'steps', 'controls', 'mode-training-data', 'mode-validation',
]

export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: 'training-data',
    title: 'Training Data',
    body: 'The main panel displays the training data in its current tokenized state. The tokenization updates after each step as the BPE algorithm progresses.',
    target: 'main',
    mode: 'training',
    mobileExpand: null,
  },
  {
    id: 'tokens',
    title: 'Tokens',
    body: 'The text is split into individual tokens. Each token displays its token ID in the lower-right corner.',
    target: 'main',
    mode: 'training',
    mobileExpand: null,
  },
  {
    id: 'vocabulary',
    title: 'Vocabulary',
    body: 'The <strong>Vocabulary</strong> tab shows the current vocabulary and how it evolves during training. Hover over an active token to highlight its occurrences in the text. Greyed-out tokens are part of the vocabulary but do not currently occur in the displayed text.',
    target: 'vocabulary',
    mode: 'training',
    expand: 'vocabulary',
  },
  {
    id: 'frequency',
    title: 'Pair Frequencies',
    body: 'At each step, BPE identifies the most frequent adjacent token pair and merges it into a new token. The <strong>Pair Frequencies</strong> panel lists token pairs ordered by their frequency in the text. Hover over a pair to highlight its occurrences.',
    target: 'frequency',
    mode: 'training',
    expand: 'frequency',
  },
  {
    id: 'steps',
    title: 'Steps',
    body: 'The <strong>Steps</strong> panel shows the complete sequence of the algorithm, from initialization to completion. Each step describes the operation performed at that point. The merge rules shown here are the rules learned during training. Click a step to jump directly to it.',
    target: 'steps',
    mode: 'training',
    expand: 'steps',
  },
  {
    id: 'controls',
    title: 'Controls',
    body: 'The control panel lets you navigate through the training steps. You can play, pause, and move through the progression manually. The playback speed can be adjusted in the settings. Click anywhere on the progression bar to jump to a specific point in the training process.',
    target: 'controls',
    mode: 'training',
    mobileExpand: null,
  },
  {
    id: 'own-data',
    title: 'Your Own Training Data',
    body: 'The provided text was chosen to illustrate how BPE can learn meaningful subword tokens, including recurring word endings. You can also provide your own training data and observe how the learned vocabulary and merge rules change.',
    target: 'mode-training-data',
    mode: 'training-data',
  },
  {
    id: 'validation',
    title: 'Validation',
    body: 'At any point during training, switch to the <strong>Validation</strong> tab to see how unseen text would be tokenized using the merge rules learned up to that point.',
    target: 'mode-validation',
    mode: 'validation',
    unobscured: ['vocabulary'],
  },
]
