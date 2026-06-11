<script setup lang="ts">
export interface StepItem {
  title: string
  description: string
}

defineProps<{
  steps: StepItem[]
}>()
</script>

<template>
  <div class="step-list">
    <div
      v-for="(step, index) in steps"
      :key="index"
      class="step-list__item"
      :class="{ 'step-list__item--last': index === steps.length - 1 }"
    >
      <span class="step-list__number">
        {{ index + 1 }}
      </span>

      <h4 class="step-list__title">{{ step.title }}</h4>

      <span
        v-if="index !== steps.length - 1"
        class="step-list__line"
      />

      <p class="step-list__description" v-html="step.description"></p>
    </div>
  </div>
</template>

<style scoped>
.step-list {
  display: flex;
  flex-direction: column;
  margin: 1.25rem 0;
  padding: 0;
}

.step-list__item {
  display: grid;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto auto;
  column-gap: 1rem;
  row-gap: 0;
  align-content: start;
}

.step-list__number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1;
  grid-column: 1;
  grid-row: 1;
  align-self: center;
  margin: 0;
}

.step-list__title {
  margin: 0;
  padding: 0;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
  line-height: 1;
  grid-column: 2;
  grid-row: 1;
  align-self: center;
}

.step-list__line {
  width: 2px;
  min-height: 16px;
  background: var(--border-secondary);
  grid-column: 1;
  grid-row: 2;
  justify-self: center;
  align-self: stretch;
}

.step-list__description {
  margin: 0;
  padding-top: 0.35rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
  grid-column: 2;
  grid-row: 2;
}

.step-list__item:not(.step-list__item--last) .step-list__description {
  margin-bottom: 1.5rem;
}
</style>
