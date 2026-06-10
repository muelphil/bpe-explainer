<script setup lang="ts">
withDefaults(defineProps<{
  sentence?: string
}>(), {
  sentence: 'Tokenization divides text into smaller meaningful units — typically words or subwords.'
})

function tokenId(s: string): number {
  if (s.length === 1) return s.charCodeAt(0)
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) & 0x7fff
  }
  return (Math.abs(h) % 49488) + 512
}

// Approximate subword tokenization as a modern tokenizer would produce it
const tokens = [
  'Token', 'ization', '▁divides', '▁text', '▁into', '▁smaller',
  '▁meaningful', '▁units', '▁\u2014', '▁typically', '▁words',
  '▁or', '▁sub', 'words', '.'
]
</script>

<template>
  <div class="subword-example">
    <div class="token-container">
      <div
        v-for="(token, idx) in tokens"
        :key="idx"
        class="token-wrapper"
      >
        <span class="token">
          {{ token }}
          <span class="token-id">{{ tokenId(token) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
