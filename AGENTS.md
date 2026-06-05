# AGENTS.md

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run type-check   # Vue TypeScript check (not tsc)
npm run test:unit    # Run all Vitest tests
npm run test:unit src/services/__tests__/BPEService.test.ts  # Run single test
npm run lint         # Run oxlint + ESLint
npm run format       # Format with Prettier
```

**Lint command order matters**: `lint:oxlint` (oxlint) then `lint:eslint` (eslint) as configured in `package.json`.

## Architecture

**Single-state architecture**:
- `BPEService` singleton (`src/services/BPEService.ts`) manages all BPE state via `reactive()`
- `useBPE` composable wraps the singleton: exports readonly state + re-exports methods
- **Never import `bpeService` directly in components** — always use `useBPE()`

**State access pattern**:
```ts
import { useBPE } from '@/composables/useBPE'
const { state, initialize, nextStep } = useBPE()
```

**Precomputed steps**: The service precomputes entire step history on initialization, storing immutable snapshots. This enables instant forward/backward navigation.

## Key Conventions

**Type imports**: Import types separately:
```ts
import type { BPESettings } from './services/types'
```

**Token coloring**: `getTokenColor()` in `src/utils/tokenColor.ts` generates deterministic colors per token content (same content = same color).

**Merge restrictions**: Default mode is `llm` (not `none`). Real LLM tokenizers restrict merges:
- Newlines only merge with newlines
- Spaces/tabs only merge with spaces/tabs
- Numbers only merge with numbers
- Letters only merge with letters
- Symbols only merge with symbols
- Mixed tokens can merge with alphanumerics

See `src/services/mergeRestrictions.ts`.

**Highlighting priority**: User hover (from `FrequencyPanel`/`VocabularyPanel`) takes priority over step-based highlighting. When user hovers, step highlighting pauses.

**Settings**: Stored in `localStorage`. `SettingsService` handles load/apply. Presets (`original-bpe`/`llm-bpe`) set all related options.

**Testing**: Vitest with jsdom. Tests live in `src/services/__tests__/` and `src/__tests__/`.

## Project Structure

```
src/
├── main.ts              # App entry (mounts App.vue)
├── services/            # Core BPE logic
│   ├── BPEService.ts    # Singleton BPE state manager with precomputed steps
│   ├── SettingsService.ts
│   ├── mergeRestrictions.ts
│   └── types.ts         # Shared types (BPEState, BPESettings, Step, etc.)
├── composables/         # Vue composables
│   └── useBPE.ts        # Exposes BPEService readonly
├── components/          # Vue components
│   ├── MainView.vue     # Top-level view router
│   ├── TrainingView.vue
│   ├── ValidationView.vue
│   ├── SettingsModal.vue
│   └── *Panel.vue       # Frequency/Vocabulary/Step panels
└── utils/               # Helpers
    └── tokenColor.ts    # Deterministic token coloring (djb2 + golden ratio)
```

## Services

### `src/services/BPEService.ts` (942 lines)
**Central singleton orchestrator** for BPE algorithm:
- Precomputes entire step history using doubly-linked list + incremental frequency map (Finding 2)
- Stores immutable step snapshots in `state.steps` (via `markRaw()`)
- Step caching with checkpoints every 20 steps + reconstruction cache (last 10 accessed)
- `nextStep()` uses fast-path delta mutation; `previousStep()` uses full reconstruction
- `MAX_ITERATIONS = 2_000` caps BPE steps regardless of break condition
- Methods: `initialize()`, `nextStep()`, `previousStep()`, `goToStep()`, `play()`, `pause()`, `reset()`, `highlightPair()`, `highlightTokenContent()`, `tokenizeInput()`

## Node Version

Requires Node.js `^20.19.0` or `>=22.12.0` (specified in `package.json` engines).
