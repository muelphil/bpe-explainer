<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{
  text?: string
}>(), {
  text: 'I love chocolate cookies at work.'
})

function visSpaces(s: string){
  if(s == " ")
    return "▁"
  return s
}

const sceneRef = ref<HTMLDivElement | null>(null)

function tokenId(s: string): number {
  return s.charCodeAt(0)
}

onMounted(() => {
  // Nothing dynamic needed — rendering is declarative
})
</script>

<template>
  <div class="char-tokenization-scene">
    <div class="token-container">
      <div
        v-for="(ch, idx) in text"
        :key="idx"
        class="token-wrapper char-token-wrapper"
      >
        <span class="token">
          {{ visSpaces(ch) }}
          <span class="token-id">{{ tokenId(ch) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
