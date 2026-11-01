import type ui from '@nuxt/ui/vite'

// The same Nuxt UI options in the build (wxt.config.ts) and in component tests (vitest.config.ts).
// The scanner finds icons written in .vue files. Icons that come from data (e.g. context icons)
// are passed in, otherwise UIcon would fetch them from the Iconify API.
export function nuxtUiOptions(dataIcons: readonly string[] = []) {
  return {
    router: false,
    colorMode: false,
    ui: { colors: { primary: 'blue', neutral: 'zinc' } },
    icon: { clientBundle: { scan: true, icons: [...dataIcons] } },
  } satisfies Parameters<typeof ui>[0]
}
