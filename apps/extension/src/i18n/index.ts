import { createI18n } from 'vue-i18n'
import en from './en.json'
import { detectLocale, type Locale } from './locale'
import pl from './pl.json'

export type MessageSchema = typeof pl

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: detectLocale(navigator.language),
  fallbackLocale: 'en',
  messages: { pl, en },
})
