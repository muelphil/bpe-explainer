<script setup lang="ts">
import { computed } from 'vue'

interface Option {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: Option[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const handleSelect = (value: string) => {
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="inline-flex w-full rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
    <button
      v-for="(option, index) in options"
      :key="option.value"
      @click="handleSelect(option.value)"
      :class="[
        'flex-1 px-4 py-2 text-sm font-medium transition-colors',
        modelValue === option.value
          ? 'bg-primary-500 text-white'
          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700',
        index > 0 && 'border-l border-slate-300 dark:border-slate-600'
      ]"
    >
      {{ option.label }}
    </button>
  </div>
</template>
