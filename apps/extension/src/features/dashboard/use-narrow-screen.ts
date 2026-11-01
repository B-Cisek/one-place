import { breakpointsTailwind, useBreakpoints } from '@vueuse/core'

// F-GRID-05: below 768 px (Tailwind's `md`) the widgets are in one column and cannot be edited
export function useNarrowScreen() {
  return useBreakpoints(breakpointsTailwind).smaller('md')
}
