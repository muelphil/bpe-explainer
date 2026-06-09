<script setup lang="ts">
const props = withDefaults(defineProps<{
  tokens?: string[]
  highlight?: string[]
}>(), {
  tokens: () => ['A', ' man', ' walked', ' past', ' a', ' snow', 'man'],
  highlight: () => ['man', ' man']
})

function tokenId(s: string): number {
  if (s.length === 1) return s.charCodeAt(0)
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h * 33) ^ s.charCodeAt(i)) & 0x7fff
  }
  return (Math.abs(h) % 49488) + 512
}

function isHighlighted(tok: string): boolean {
  return props.highlight.includes(tok)
}
</script>

<template>
  <div class="vocab-spaces-container">
    <div class="token-container" style="justify-content: center;">
      <div
        v-for="(token, idx) in tokens"
        :key="idx"
        class="token-wrapper"
      >
        <span
          class="token"
          :class="{ 'token-highlight': isHighlighted(token) }"
        >
          {{ token }}
          <span class="token-id">{{ tokenId(token) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
