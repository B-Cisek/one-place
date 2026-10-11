export const LOCALES = ['pl', 'en'] as const

export type Locale = (typeof LOCALES)[number]

// F-I18N-02: before sign-in the language comes from the browser, `pl*` means Polish
export function detectLocale(browserLanguage: string): Locale {
  return browserLanguage.toLowerCase().startsWith('pl') ? 'pl' : 'en'
}
