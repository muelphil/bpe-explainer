<script setup lang="ts">
import { displayTokenContent } from '../utils/tokenColor'

export interface MergeNode {
  content: string
  left?: MergeNode
  right?: MergeNode
}

// Allows self-referencing in the template for recursive rendering
defineOptions({ name: 'TokenMergeTree' })

const props = defineProps<{
  node: MergeNode
  depth: number
}>()
</script>

<template>
  <!-- Leaf node at any depth: always just plain text, never a box -->
  <template v-if="!props.node.left">{{ displayTokenContent(props.node.content) }}</template>

  <!-- Root merge node (depth=0): render children directly, outer .token provides the visual boundary -->
  <template v-else-if="props.depth === 0">
    <TokenMergeTree :node="props.node.left" :depth="1" />
    <TokenMergeTree :node="props.node.right!" :depth="1" />
  </template>

  <!-- Merged sub-token at depth > 0: this node IS itself a merge result, so box it -->
  <span
    v-else
    class="merge-part"
    :class="`merge-depth-${Math.min(props.depth, 4)}`"
  >
    <TokenMergeTree :node="props.node.left" :depth="props.depth + 1" />
    <TokenMergeTree :node="props.node.right!" :depth="props.depth + 1" />
  </span>
</template>

<style scoped>
.merge-part {
  border-radius: 3px;
  display: inline-block;
  padding: 1px 2px;
  margin: 1px 1px;
  white-space: pre;
}

/* Light mode: prominent at depth 1, fading with depth */
.merge-depth-1 { border: 2px solid rgb(18, 23, 40, 0.60); }
.merge-depth-2 { border: 2px solid rgb(18, 23, 40, 0.40); }
.merge-depth-3 { border: 2px solid rgb(18, 23, 40, 0.28); }
.merge-depth-4 { border: 2px solid rgb(18, 23, 40, 0.18); }

/* Dark mode: white-tinted borders */
:global(.dark) .merge-depth-1 { border-color: rgba(255, 255, 255, 0.34); }
:global(.dark) .merge-depth-2 { border-color: rgba(255, 255, 255, 0.22); }
:global(.dark) .merge-depth-3 { border-color: rgba(255, 255, 255, 0.14); }
:global(.dark) .merge-depth-4 { border-color: rgba(255, 255, 255, 0.09); }
</style>

