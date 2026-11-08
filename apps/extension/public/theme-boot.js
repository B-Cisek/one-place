// Runs before the first paint, so the new tab never flashes another theme (F-THEME-05).
// A classic script file, not a module: modules run only after the page is parsed, and MV3 does
// not allow inline scripts. It repeats what applyTheme() in src/theme/apply-theme.ts does with
// the saved entry. The block keeps the variables out of the global scope.
{
  let theme = { mode: 'system', vars: {} }
  try {
    theme = JSON.parse(localStorage.getItem('one-place:theme')) ?? theme
  } catch {
    // A broken entry: the system mode until the app applies the right theme
  }
  const root = document.documentElement
  const systemDark = matchMedia('(prefers-color-scheme: dark)').matches
  root.classList.toggle('dark', theme.mode === 'dark' || (theme.mode === 'system' && systemDark))
  for (const [name, value] of Object.entries(theme.vars)) root.style.setProperty(name, value)
}
