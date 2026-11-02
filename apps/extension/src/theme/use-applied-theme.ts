import type { ThemeSettings } from '@one-place/shared'
import { usePreferredDark } from '@vueuse/core'
import { watchEffect } from 'vue'
import { applyTheme } from './apply-theme'

// Applies the theme now and after every change, also of the system theme in the system mode
// (F-THEME-01). null means the data is not there yet: the page keeps the theme from the boot script.
export function useAppliedTheme(theme: () => ThemeSettings | null) {
  const systemDark = usePreferredDark()
  watchEffect(() => {
    const current = theme()
    if (current) applyTheme(current, systemDark.value)
  })
}
