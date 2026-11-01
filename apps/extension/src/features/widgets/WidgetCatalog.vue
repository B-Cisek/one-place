<script setup lang="ts">
import type { WidgetType } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { widgetRegistry } from '@/widgets/registry'
import { useAddWidget } from './use-add-widget'

const props = defineProps<{ contextId: string }>()
const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
const addWidget = useAddWidget(() => props.contextId)

// F-WGT-01: every type from the registry, with its name, icon and description
const definitions = Object.values(widgetRegistry)

function add(type: WidgetType) {
  addWidget(type)
  open.value = false
}
</script>

<template>
  <UModal v-model:open="open" :title="t('widgets.catalog.title')">
    <template #body>
      <ul class="space-y-2">
        <li v-for="definition in definitions" :key="definition.type">
          <button
            type="button"
            class="flex w-full items-center gap-3 rounded-lg border border-default p-3 text-left hover:bg-elevated"
            @click="add(definition.type)"
          >
            <UIcon :name="definition.icon" class="size-6 shrink-0 text-primary" />
            <span class="min-w-0">
              <span class="block font-medium text-highlighted">{{ t(definition.name) }}</span>
              <span class="block text-sm text-muted">{{ t(definition.description) }}</span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </UModal>
</template>
