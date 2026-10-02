<script setup lang="ts">
import {ref, computed} from 'vue'
import {useBPE} from './composables/useBPE'
import {useIsMobile} from './composables/useIsMobile'
import {useTour} from './composables/useTour'
import MainView from './components/MainView.vue'
import SettingsModal from './components/SettingsModal.vue'
import FrequencyPanel from './components/FrequencyPanel.vue'
import VocabularyPanel from './components/VocabularyPanel.vue'
import StepPanel from './components/StepPanel.vue'
import ControlPanel from './components/ControlPanel.vue'
import ArticleVisualizationLayout from './components/ArticleVisualizationLayout.vue'
import BlogArticle from './components/BlogArticle.vue'
import GuidedTour from './components/GuidedTour.vue'
import {trainingPresets} from './data/trainingPresets'
import type {BPESettings} from './services/types'

const {initialize, updateSettings, goToStep, state, settings, currentStepData} = useBPE()
const {isMobile} = useIsMobile()

const isSettingsOpen = ref(false)
const hoveredPair = ref<[string, string] | null>(null)
const hoveredTokenContent = ref<string | null>(null)
const showSidebars = ref(false)
const showControlPanel = ref(false)
const showFrequencySteps = ref(false)

// Per-panel expansion state, shared with the guided tour (start collapsed on mobile)
const {panelExpanded} = useTour()
const {frequency: frequencyExpanded, vocabulary: vocabularyExpanded, steps: stepsExpanded} = panelExpanded
frequencyExpanded.value = !isMobile.value
vocabularyExpanded.value = !isMobile.value
stepsExpanded.value = !isMobile.value

const anyPanelExpanded = computed(() =>
  (showFrequencySteps.value && frequencyExpanded.value) ||
  vocabularyExpanded.value ||
  (showFrequencySteps.value && stepsExpanded.value)
)

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

// Settings that don't affect the BPE algorithm and so don't need a re-initialization
const UI_ONLY_SETTINGS: ReadonlyArray<keyof BPESettings> = ['tourSpotlight', 'tourPulse']

const handleSaveSettings = (newSettings: BPESettings) => {
  const needsReinit = (Object.keys(newSettings) as Array<keyof BPESettings>)
    .some(key => !UI_ONLY_SETTINGS.includes(key) && newSettings[key] !== settings.value[key])

  // Update settings first
  updateSettings(newSettings)

  // Re-initialize if we have training data
  if (needsReinit && state.trainingData) {
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

const handleModeChange = (mode: {
  showSidebars: boolean,
  showControlPanel: boolean,
  showFrequencySteps: boolean
}) => {
  // Reset expansion refs for panels that are about to unmount (v-if becomes false),
  // so that when they remount they match their initialExpanded prop (collapsed on mobile).
  if (!mode.showSidebars) {
    // All panels unmount
    frequencyExpanded.value = !isMobile.value
    vocabularyExpanded.value = !isMobile.value
    stepsExpanded.value = !isMobile.value
  } else if (!mode.showFrequencySteps) {
    // FrequencyPanel and StepPanel unmount (validation mode)
    frequencyExpanded.value = !isMobile.value
    stepsExpanded.value = !isMobile.value
  }
  showSidebars.value = mode.showSidebars
  showControlPanel.value = mode.showControlPanel
  showFrequencySteps.value = mode.showFrequencySteps
}

/** Resolve training data from localStorage; fall back to the "text" preset. */
function resolveTrainingData(): string {
  const LS_CUSTOM = 'bpe-custom-training-data'
  const LS_PRESET = 'bpe-selected-preset'

  const custom = localStorage.getItem(LS_CUSTOM)
  if (custom !== null) return custom

  const presetId = localStorage.getItem(LS_PRESET)
  if (presetId) {
    const preset = trainingPresets.find(p => p.id === presetId)
    if (preset) return preset.data
  }

  // Default: use the last preset in the list (Text)
  const lastPreset = trainingPresets[trainingPresets.length - 1]
  return lastPreset?.data ?? 'No Data'
}

// Start in training mode: initialize BPE with saved/default data
const initialTrainingData = resolveTrainingData()
initialize(initialTrainingData)
showSidebars.value = true
showControlPanel.value = true
showFrequencySteps.value = true
</script>

<template>
  <div class="h-screen w-screen bg-slate-50 dark:bg-slate-900 overflow-hidden flex flex-col">
    <MainView
      class="flex-1 overflow-hidden min-h-0"
      :hoveredPair="hoveredPair"
      :hoveredTokenContent="hoveredTokenContent"
      :effectiveHoveredPair="effectiveHoveredPair"
      :effectiveHoveredTokenContent="effectiveHoveredTokenContent"
      :mobileContentHidden="isMobile && showSidebars && anyPanelExpanded"
      @openSettings="handleOpenSettings"
      @hoverPair="handlePairHover"
      @hoverToken="handleTokenHover"
      @goToStep="handleGoToStep"
      @modeChange="handleModeChange"
    >
      <!-- Blog article panel (left of visualization on desktop, overlay on mobile) -->
      <template #leftPanel>
        <ArticleVisualizationLayout>
          <BlogArticle/>
        </ArticleVisualizationLayout>
      </template>

      <!-- Sidebar: full-width below content on mobile, fixed w-96 on the right on desktop -->
      <template #sidebar>
        <div
          v-if="showSidebars"
          class="flex flex-col overflow-hidden border-slate-200 dark:border-slate-700"
          :class="[isMobile ? 'w-full border-t' : 'w-96 border-l', isMobile && anyPanelExpanded ? 'flex-1' : 'flex-shrink-0']"
        >
          <div class="flex-1 flex flex-col overflow-hidden">
            <FrequencyPanel
              v-if="showFrequencySteps"
              :hoveredPair="effectiveHoveredPair"
              v-model:expanded="frequencyExpanded"
              @hoverPair="handlePairHover"
            />
            <VocabularyPanel
              :hoveredTokenContent="effectiveHoveredTokenContent"
              v-model:expanded="vocabularyExpanded"
              @hoverToken="handleTokenHover"
            />
            <StepPanel
              v-if="showFrequencySteps"
              v-model:expanded="stepsExpanded"
              @goToStep="handleGoToStep"
            />
          </div>

          <!-- Control panel at bottom (only in training mode) -->
          <ControlPanel v-if="showControlPanel" data-tour="controls"/>
        </div>
      </template>
    </MainView>

    <!-- Settings Modal -->
    <SettingsModal
      :isOpen="isSettingsOpen"
      :settings="settings"
      @close="isSettingsOpen = false"
      @save="handleSaveSettings"
    />

    <!-- Guided tour overlay + card -->
    <GuidedTour/>
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
