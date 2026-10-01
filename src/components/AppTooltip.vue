<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = withDefaults(defineProps<{
  text: string
  placement?: 'top' | 'bottom'
}>(), {
  placement: 'top',
})

const isOpen = ref(false)
const trigger = ref<HTMLElement | null>(null)
const position = ref({ top: 0, left: 0 })
const tooltipId = `tooltip-${Math.random().toString(36).slice(2)}`

const tooltipStyle = computed(() => ({
  top: `${position.value.top}px`,
  left: `${position.value.left}px`,
  transform: props.placement === 'top'
    ? 'translate(-50%, calc(-100% - 8px))'
    : 'translate(-50%, 8px)',
}))

const open = async () => {
  isOpen.value = true
  await nextTick()
  const rect = trigger.value?.getBoundingClientRect()
  if (rect) {
    position.value = {
      top: props.placement === 'top' ? rect.top : rect.bottom,
      left: rect.left + rect.width / 2,
    }
  }
}

const close = () => {
  isOpen.value = false
}
</script>

<template>
  <span
    ref="trigger"
    class="inline-flex"
    :aria-describedby="isOpen ? tooltipId : undefined"
    @mouseenter="open"
    @mouseleave="close"
    @focusin="open"
    @focusout="close"
    @keydown.escape="close"
  >
    <slot />
  </span>
  <Teleport to="body">
    <span
      v-if="isOpen"
      :id="tooltipId"
      role="tooltip"
      class="fixed z-[100] max-w-64 rounded-md bg-slate-900 px-2.5 py-2 text-xs leading-relaxed text-white shadow-lg dark:bg-slate-700"
      :style="tooltipStyle"
    >{{ text }}</span>
  </Teleport>
</template>
