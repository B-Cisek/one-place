import { describe, expect, it } from 'vitest'
import { i18n } from './index'
import { polishPluralIndex } from './plural'

describe('polishPluralIndex', () => {
  it('picks one of the forms: none, one, few (2-4) and many', () => {
    const forms = [0, 1, 2, 4, 5, 11, 12, 14, 21, 22, 25, 104, 112].map(polishPluralIndex)
    expect(forms).toEqual([0, 1, 2, 2, 3, 3, 3, 3, 3, 2, 3, 2, 3])
  })
})

describe('plural messages', () => {
  it('use the Polish rule for Polish and the default one for English', () => {
    const { t } = i18n.global
    expect(t('contexts.delete.widgets', 3, { locale: 'pl' })).toBe('Usunie też 3 widgety.')
    expect(t('contexts.delete.widgets', 5, { locale: 'pl' })).toBe('Usunie też 5 widgetów.')
    expect(t('contexts.delete.widgets', 3, { locale: 'en' })).toBe(
      'Its 3 widgets will be deleted too.',
    )
  })
})
