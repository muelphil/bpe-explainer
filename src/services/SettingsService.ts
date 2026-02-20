import type { BPESettings } from './types'

const SETTINGS_KEY = 'bpe-visualizer-settings'

const DEFAULT_SETTINGS: BPESettings = {
  initialVocab: 'bytes',
  breakCondition: 'maxVocabSize',
  maxVocabSize: 512,
  playSpeed: 500,
  darkMode: false,
  mergingRestriction: 'llm'
}

export class SettingsService {
  /**
   * Load settings from localStorage
   */
  static load(): BPESettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle any missing keys
        return { ...DEFAULT_SETTINGS, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load settings from localStorage:', error)
    }
    return { ...DEFAULT_SETTINGS }
  }

  /**
   * Save settings to localStorage
   */
  static save(settings: BPESettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (error) {
      console.error('Failed to save settings to localStorage:', error)
    }
  }

  /**
   * Apply settings (e.g., dark mode to document)
   */
  static apply(settings: BPESettings): void {
    // Apply dark mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  /**
   * Get default settings
   */
  static getDefaults(): BPESettings {
    return { ...DEFAULT_SETTINGS }
  }
}
