import type { WidgetType } from '@one-place/shared'
import { v7 as uuidv7 } from 'uuid'
import { type MaybeRefOrGetter, toValue } from 'vue'
import { compactLayout, placeNewWidget } from '@/features/dashboard/layout'
import { useCreateWidget, useWidgets } from '@/queries/widgets'
import { widgetRegistry } from '@/widgets/registry'

export function useAddWidget(contextId: MaybeRefOrGetter<string>) {
  const { data: widgets } = useWidgets(contextId)
  const { mutate } = useCreateWidget()

  return (type: WidgetType) => {
    // F-WGT-02: below the other widgets (as the grid shows them), with the default size and config.
    // The API fills in the config from `{}`, and so does the widget until the API answers.
    const place = placeNewWidget(
      compactLayout(widgets.value ?? []),
      widgetRegistry[type].defaultSize,
    )
    mutate({ contextId: toValue(contextId), id: uuidv7(), type, config: {}, ...place })
  }
}
