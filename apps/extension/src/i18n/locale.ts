import type { Locale } from '@one-place/shared'

// F-I18N-02: before sign-in the language comes from the browser, `pl*` means Polish
export function detectLocale(browserLanguage: string): Locale {
  return browserLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}
