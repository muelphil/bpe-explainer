<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
}>(), {
  icon: 'ℹ️'
})
</script>

<template>
  <div class="blog-article__infoblock">
    <span class="blog-article__infoblock-icon">{{ icon }}</span>
    <div>
      <slot />
    </div>
  </div>
</template>
