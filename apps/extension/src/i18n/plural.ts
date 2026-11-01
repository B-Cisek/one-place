// Polish messages with a count have four forms: none | one | few | many.
// "few" is 2–4, also 22–24, 32–34…, but not 12–14: 2 widgety, 5 widgetów, 12 widgetów, 22 widgety.
export function polishPluralIndex(count: number) {
  if (count === 0) return 0
  if (count === 1) return 1
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) return 2
  return 3
}
