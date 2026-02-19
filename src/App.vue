<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBPE } from './composables/useBPE'
import MainTokenView from './components/MainTokenView.vue'
import SettingsModal from './components/SettingsModal.vue'
import FrequencyPanel from './components/FrequencyPanel.vue'
import VocabularyPanel from './components/VocabularyPanel.vue'
import StepPanel from './components/StepPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import InitializationPanel from './components/InitializationPanel.vue'
import type { BPESettings } from './services/types'

const { initialize, goToStep, state, settings, currentStepData } = useBPE()

const isSettingsOpen = ref(false)
const hoveredPair = ref<[string, string] | null>(null)
const hoveredTokenContent = ref<string | null>(null)
const isInitialized = ref(false)

// Computed properties for highlighting - user hover takes priority, then step highlighting
const effectiveHoveredPair = computed(() => {
  // User hover takes priority
  if (hoveredPair.value) return hoveredPair.value

  // If no user hover, use step highlighting
  if (currentStepData.value?.highlightPair) {
    return currentStepData.value.highlightPair
  }

  return null
})

const effectiveHoveredTokenContent = computed(() => {
  // User hover takes priority
  if (hoveredTokenContent.value) return hoveredTokenContent.value

  // If no user hover, use step highlighting
  if (currentStepData.value?.highlightTokenContent) {
    return currentStepData.value.highlightTokenContent
  }

  return null
})

const handleInitialize = (trainingData: string) => {
  initialize(trainingData)
  isInitialized.value = true
}

const handleOpenSettings = () => {
  isSettingsOpen.value = true
}

const handleSaveSettings = (newSettings: BPESettings) => {
  // Re-initialize with new settings
  if (state.trainingData) {
    initialize(state.trainingData, newSettings)
  }
}

const handlePairHover = (pair: [string, string] | null) => {
  hoveredPair.value = pair
  hoveredTokenContent.value = null
}

const handleTokenHover = (content: string | null) => {
  hoveredTokenContent.value = content
  hoveredPair.value = null
}

const handleGoToStep = (stepNumber: number) => {
  goToStep(stepNumber)
}

// Apply dark mode
watch(() => settings.value.darkMode, (darkMode) => {
  if (darkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}, { immediate: true })
</script>

<template>
  <div class="h-screen w-screen flex bg-slate-50 dark:bg-slate-900 overflow-hidden">
    <!-- Left Side: Main Token View -->
    <div class="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700">
      <InitializationPanel
        v-if="!isInitialized"
        @initialize="handleInitialize"
      />
      <MainTokenView
        v-else
        :hoveredPair="effectiveHoveredPair"
        :hoveredTokenContent="effectiveHoveredTokenContent"
        @openSettings="handleOpenSettings"
      />
    </div>

    <!-- Right Side: Control Panels -->
    <div class="w-96 flex flex-col bg-white dark:bg-slate-800 overflow-hidden" v-if="isInitialized">
      <!-- Panels stack vertically with no gaps, filling available height -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <FrequencyPanel 
          :hoveredPair="effectiveHoveredPair"
          @hoverPair="handlePairHover" 
        />
        <VocabularyPanel 
          :hoveredTokenContent="effectiveHoveredTokenContent"
          @hoverToken="handleTokenHover" 
        />
        <StepPanel @goToStep="handleGoToStep" />
      </div>

      <!-- Control panel at bottom -->
      <ControlPanel />
    </div>

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="isSettingsOpen"
      :settings="settings"
      @close="isSettingsOpen = false"
      @save="handleSaveSettings"
    />
  </div>
</template>

<style>
/* Global styles */
html {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

body {
  margin: 0;
  padding: 0;
}

#app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
