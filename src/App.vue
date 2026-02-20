<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useBPE } from './composables/useBPE'
import MainView from './components/MainView.vue'
import SettingsModal from './components/SettingsModal.vue'
import FrequencyPanel from './components/FrequencyPanel.vue'
import VocabularyPanel from './components/VocabularyPanel.vue'
import StepPanel from './components/StepPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import type { BPESettings } from './services/types'

const { initialize, updateSettings, goToStep, state, settings, currentStepData } = useBPE()

const isSettingsOpen = ref(false)
const hoveredPair = ref<[string, string] | null>(null)
const hoveredTokenContent = ref<string | null>(null)
const showSidebars = ref(false)
const showControlPanel = ref(false)

// Computed properties for highlighting - user hover takes priority, then step highlighting
const effectiveHoveredPair = computed(() => {
  // If user is hovering anything (pair OR token), pause step-based highlighting
  if (hoveredPair.value || hoveredTokenContent.value) {
    return hoveredPair.value // Return pair if hovering pair, null if hovering token
  }

  // No user interaction - use step highlighting
  if (currentStepData.value?.highlightPair) {
    return currentStepData.value.highlightPair
  }

  return null
})

const effectiveHoveredTokenContent = computed(() => {
  // If user is hovering anything (pair OR token), pause step-based highlighting
  if (hoveredPair.value || hoveredTokenContent.value) {
    return hoveredTokenContent.value // Return token if hovering token, null if hovering pair
  }

  // No user interaction - use step highlighting
  if (currentStepData.value?.highlightTokenContent) {
    return currentStepData.value.highlightTokenContent
  }

  return null
})

const handleOpenSettings = () => {
  isSettingsOpen.value = true
}

const handleSaveSettings = (newSettings: BPESettings) => {
  // Update settings first
  updateSettings(newSettings)
  
  // Re-initialize if we have training data
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

const handleModeChange = (mode: { showSidebars: boolean, showControlPanel: boolean }) => {
  showSidebars.value = mode.showSidebars
  showControlPanel.value = mode.showControlPanel
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
  <div class="h-screen w-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex">
    <!-- Main View -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <MainView
        :hoveredPair="hoveredPair"
        :hoveredTokenContent="hoveredTokenContent"
        :effectiveHoveredPair="effectiveHoveredPair"
        :effectiveHoveredTokenContent="effectiveHoveredTokenContent"
        @openSettings="handleOpenSettings"
        @hoverPair="handlePairHover"
        @hoverToken="handleTokenHover"
        @goToStep="handleGoToStep"
        @modeChange="handleModeChange"
      />
    </div>

    <!-- Right Sidebars (shown in training and validation modes) -->
    <div v-if="showSidebars" class="w-96 flex flex-col overflow-hidden border-l border-slate-200 dark:border-slate-700">
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

      <!-- Control panel at bottom (only in training mode) -->
      <ControlPanel v-if="showControlPanel" />
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
