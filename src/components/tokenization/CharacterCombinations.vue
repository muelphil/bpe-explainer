<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  alphabet?: string
  rows?: number
}>(), {
  alphabet: 'abcdefghijklmnopqrstuvwxyz',
  rows: 4
})

const MAX_PER_ROW = 120

function* generateCombos(length: number): Generator<string> {
  const chars = props.alphabet.split('')
  if (length === 1) {
    for (const c of chars) yield c
    return
  }
  for (const c of chars) {
    for (const sub of generateCombos(length - 1)) {
      yield c + sub
    }
  }
}

const comboRows = computed(() => {
  const result: { length: number; tokens: string[] }[] = []
  for (let len = 1; len <= props.rows; len++) {
    const tokens: string[] = []
    const gen = generateCombos(len)
    for (const item of gen) {
      tokens.push(item)
      if (tokens.length >= MAX_PER_ROW) break
    }
    result.push({ length: len, tokens })
  }
  return result
})
</script>

<template>
  <div class="char-combos-container">
    <div
      v-for="row in comboRows"
      :key="row.length"
      class="char-combos-row-item"
    >
      <span class="combos-label">len {{ row.length }}</span>
      <div class="char-combos-row-wrap">
        <div class="char-combos-row">
          <div
            v-for="(token, idx) in row.tokens"
            :key="idx"
            class="token-wrapper"
          >
            <span class="token small no-id">{{ token }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
