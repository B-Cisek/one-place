import { onScopeDispose, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { detectLocale, resolveLocale } from '@/i18n/locale'
import { useSettings } from '@/queries/settings'

// F-I18N-02: while signed in, the language saved on the account wins. The settings come from
// the cache before the first render, so the dashboard never flashes in the other language.
export function useAccountLocale() {
  const { locale } = useI18n({ useScope: 'global' })
  const { data: settings } = useSettings()
  watchEffect(() => {
    locale.value = resolveLocale(settings.value?.locale, navigator.language)
  })
  // Signed out: back to the browser language
  onScopeDispose(() => {
    locale.value = detectLocale(navigator.language)
  })
}
