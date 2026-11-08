import {
  type ContextDto,
  resolveTheme,
  type SettingsDto,
  type ThemeSettings,
} from '@one-place/shared'
import { useActiveContext } from '@/features/contexts/active-context'
import { useContexts } from '@/queries/contexts'
import { useSettings } from '@/queries/settings'
import { useAppliedTheme } from '@/theme/use-applied-theme'

// The effective theme of the dashboard: the global one with the override of the active context.
// null until both the settings and the contexts are loaded: the default theme for a moment
// (or the global one before the override arrives) would flash.
export function accountTheme(
  settings: SettingsDto | undefined,
  contexts: ContextDto[] | undefined,
  active: ContextDto | null,
): ThemeSettings | null {
  if (!settings || !contexts) return null
  return resolveTheme(settings.theme, active?.themeOverride)
}

export function useAccountTheme() {
  const { data: settings } = useSettings()
  const { data: contexts } = useContexts()
  const active = useActiveContext()
  useAppliedTheme(() => accountTheme(settings.value, contexts.value, active.value))
}
