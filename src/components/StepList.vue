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
      <div class="step-list__marker">
        <span class="step-list__number">
          {{ index + 1 }}
        </span>

        <span
          v-if="index !== steps.length - 1"
          class="step-list__line"
        />
      </div>

      <div class="step-list__content">
        <h4 class="step-list__title">{{ step.title }}</h4>
        <p class="step-list__description" v-html="step.description"></p>
      </div>
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

/* KEY FIX: switch to grid so we get full row height control */
.step-list__item {
  display: grid;
  grid-template-columns: 26px 1fr;
  column-gap: 1rem;
  position: relative;
}

/* marker column */
.step-list__marker {
  position: relative;
  width: 26px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* circle */
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
  flex-shrink: 0;
  z-index: 1;
}

/* connector line */
.step-list__line {
  position: absolute;
  top: 26px;          /* starts right below circle */
  bottom: 0;          /* stretches to bottom of row */
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  background: var(--border-secondary);
}

/* content */
.step-list__content {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding-bottom: 1.5rem;
}

.step-list__item--last .step-list__content {
  padding-bottom: 0;
}

.step-list__title {
  margin: 0;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-primary);
  line-height: 1.2;
}

.step-list__description {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.6;
}
</style>
