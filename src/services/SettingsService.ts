import type { BPESettings } from './types'

const SETTINGS_KEY = 'bpe-visualizer-settings'

const DEFAULT_SETTINGS: BPESettings = {
  initialVocab: 'bytes',
  breakCondition: 'maxVocabSize',
  maxVocabSize: 512,
  targetCompressionRate: 50,
  playSpeed: 500,
  darkMode: true,
  mergingRestriction: 'llm',
  tourSpotlight: true,
  tourPulse: true
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
        // Migrate old values to 'presentChars'
        if (parsed.initialVocab === 'characters') {
          parsed.initialVocab = 'presentChars'
        }
        if (parsed.initialVocab === 'unicodeChars') {
          parsed.initialVocab = 'presentChars'
        }
        // Migrate the former spotlight variants ('off' | 'persistent' | 'flash') to a boolean
        if (typeof parsed.tourSpotlight === 'string') {
          parsed.tourSpotlight = parsed.tourSpotlight !== 'off'
        }
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
    // Apply dark mode. The color-scheme CSS property (main.css) follows
    // this class, so browser UI (toolbars) adapts automatically.
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
