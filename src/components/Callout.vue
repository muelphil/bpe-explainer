<script setup lang="ts">
import {FlaskConical, Info, Target} from 'lucide-vue-next'

type CalloutIcon = 'info' | 'task'

withDefaults(defineProps<{
  icon: CalloutIcon
  title: string
}>(), {
  icon: 'info',
  title: ''
})

const iconMap: Record<CalloutIcon, typeof Info> = {
  info: Info,
  task: FlaskConical,
}
</script>

<template>
  <div class="blog-article__infoblock">
    <div class="blog-article__infoblock-header">
      <component :is="iconMap[icon]" :size="18" class="blog-article__infoblock-icon" />
      <span class="blog-article__infoblock-title">{{ title }}</span>
    </div>
    <div class="blog-article__infoblock-content">
      <slot />
    </div>
  </div>
</template>
