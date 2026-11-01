import type { WidgetSize, WidgetType } from '@one-place/shared'
import type { AsyncComponentLoader } from 'vue'

// What the dashboard knows about a widget type before the widget's code is loaded. It is on the
// start-up path, so it has no Zod schema: the components bring their config schema with them.
export interface WidgetDefinition {
  type: WidgetType
  // i18n keys
  name: string
  description: string
  icon: string
  defaultSize: WidgetSize
  minSize: WidgetSize
  // Gets the prop `widget: WidgetDto`
  component: AsyncComponentLoader
  // Gets the prop `widget: WidgetDto` and emits `save` with the new config
  settingsComponent?: AsyncComponentLoader
}
