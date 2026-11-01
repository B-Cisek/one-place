<script setup lang="ts">
import type { WidgetDto } from '@one-place/shared'
import { defineAsyncComponent, onErrorCaptured, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { findWidgetDefinition } from '@/widgets/registry'

const props = defineProps<{ widget: WidgetDto; editMode: boolean }>()
const { t } = useI18n()

// The type of a widget never changes, so the definition is read once
const definition = findWidgetDefinition(props.widget.type)
// The widget's code is loaded only when it is on the dashboard
const WidgetBody = definition ? defineAsyncComponent(definition.component) : null

const error = ref<unknown>(null)

// F-WGT-05: an error thrown while rendering the widget (or loading its code) stays in its frame.
// Returning false stops it from reaching the rest of the dashboard.
onErrorCaptured((caught) => {
  console.error(`Widget ${props.widget.id} (${props.widget.type}) failed`, caught)
  error.value = caught
  return false
})

// The error message replaced the widget, so clearing it mounts the widget from scratch
function retry() {
  error.value = null
}
</script>

<template>
  <article
    class="relative flex h-full flex-col overflow-hidden rounded-lg border border-default bg-default"
  >
    <header
      v-if="editMode"
      class="widget-drag-handle flex h-9 shrink-0 cursor-move items-center gap-2 border-b border-default bg-elevated px-2 text-sm"
    >
      <UIcon name="i-lucide-grip-vertical" class="size-4 text-dimmed" />
      <UIcon :name="definition?.icon ?? 'i-lucide-puzzle'" class="size-4 text-muted" />
      <span class="truncate">{{
        definition ? t(definition.name) : t('widgets.unknown.name')
      }}</span>
    </header>
    <div class="min-h-0 flex-1 overflow-auto p-3">
      <!-- F-WGT-06 -->
      <UEmpty
        v-if="!WidgetBody"
        icon="i-lucide-puzzle"
        :title="t('widgets.unknown.title')"
        variant="naked"
        size="sm"
      />
      <UEmpty
        v-else-if="error"
        icon="i-lucide-bug"
        :title="t('widgets.error.title')"
        :actions="[
          { label: t('widgets.error.retry'), icon: 'i-lucide-rotate-ccw', onClick: retry },
        ]"
        variant="naked"
        size="sm"
      />
      <component :is="WidgetBody" v-else :widget="widget" />
    </div>
  </article>
</template>
