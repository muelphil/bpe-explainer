# Byte Pair Encoding Demo - Copilot Instructions

## Project Overview

Interactive Vue 3 app that visualizes the Byte Pair Encoding (BPE) tokenization algorithm step-by-step. The app lets users input training data, watch the algorithm merge token pairs, and see how vocabulary grows and compression improves.

## Build, Test, and Lint

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Type checking
npm run type-check

# Run all tests
npm run test:unit

# Run single test file
npm run test:unit src/services/__tests__/BPEService.test.ts

# Lint everything
npm run lint

# Just oxlint
npm run lint:oxlint

# Just ESLint
npm run lint:eslint

# Format code
npm run format
```

## Architecture

### Core Service Layer

**BPEService** (`src/services/BPEService.ts`) is the heart of the app - a singleton class instance that:
- Manages the entire BPE algorithm state using Vue's `reactive()`
- Precomputes all merge steps on initialization (stores history as immutable snapshots)
- Provides methods for stepping through the algorithm forward/backward/jumping to specific steps
- Calculates pair frequencies, compression ratios, and maintains vocabulary
- Handles play/pause functionality with configurable speed

**Key insight**: The service precomputes the entire step history upfront rather than computing on-the-fly. Each step stores complete snapshots of tokens and vocabulary, enabling instant forward/backward navigation.

### Composable Pattern

**useBPE** (`src/composables/useBPE.ts`) wraps the BPEService singleton:
- Exports readonly reactive state to prevent accidental mutations
- Provides computed properties for common derived values
- Re-exports service methods for components to use
- All components access BPE state through this composable, not directly from the service

### Merge Restrictions

**mergeRestrictions.ts** (`src/services/mergeRestrictions.ts`) defines token merging rules:
- `none` mode: Any adjacent tokens can merge
- `llm` mode (default): Mimics real LLM tokenizers with strict rules:
  - Newlines only merge with newlines
  - Spaces/tabs only merge with spaces/tabs
  - Pure numbers only merge with numbers
  - Pure letters only merge with letters
  - Pure symbols only merge with symbols
  - Mixed tokens can merge with alphanumerics

These restrictions are applied during frequency calculation to filter which pairs are candidates for merging.

### Highlighting System

Dual-source highlighting with user hover taking priority:
- User hovers on FrequencyPanel/VocabularyPanel → sets local hover state in App.vue
- Step navigation highlights relevant pairs/tokens → stored in Step objects
- `effectiveHoveredPair` and `effectiveHoveredTokenContent` computed properties merge these sources with user hover winning

## Key Conventions

### State Management
- Single `BPEService` singleton instance exported from `BPEService.ts`
- All state is reactive via Vue's `reactive()`
- Components access state through `useBPE()` composable only
- Never import `bpeService` directly in components

### Type Imports
- Import types separately: `import type { BPESettings } from './services/types'`
- All shared types live in `src/services/types.ts`

### Component Structure
- Panel components handle their own layout/styling
- App.vue orchestrates panels and manages hover state coordination
- Settings changes trigger full re-initialization with new settings

### Token Coloring
- `getTokenColor()` in `src/utils/tokenColor.ts` generates deterministic colors per token content
- Colors assigned during vocabulary creation and remain consistent

### Testing
- Vitest with jsdom environment
- Tests live in `__tests__` directories next to source files
- Focus on BPEService logic and merge restriction rules
- Component tests use `@vue/test-utils`

## Node Version

Requires Node.js `^20.19.0` or `>=22.12.0` (specified in package.json engines field)
