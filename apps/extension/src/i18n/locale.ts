import type { Locale } from '@one-place/shared'

// F-I18N-02: before sign-in the language comes from the browser, `pl*` means Polish
export function detectLocale(browserLanguage: string): Locale {
  return browserLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}

// F-I18N-02: after sign-in the language saved on the account wins
export function resolveLocale(saved: Locale | null | undefined, browserLanguage: string): Locale {
  return saved ?? detectLocale(browserLanguage)
}
