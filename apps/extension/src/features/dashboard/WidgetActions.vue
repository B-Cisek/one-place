<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { WidgetDto } from '@one-place/shared'
import { computed, defineAsyncComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDeleteWidget, useUpdateWidgetConfig } from '@/queries/widgets'
import type { WidgetDefinition } from '@/widgets/types'

// Loaded on the first click on the widget's menu button. UDropdownMenu alone adds about 100 kB,
// which the first render of the dashboard does not need.
const props = defineProps<{ widget: WidgetDto; definition: WidgetDefinition | null }>()
const menuOpen = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { mutate: updateConfig } = useUpdateWidgetConfig()
const { mutate: deleteWidget } = useDeleteWidget()

const name = computed(() =>
  props.definition ? t(props.definition.name) : t('widgets.unknown.name'),
)
const settingsLoader = props.definition?.settingsComponent
const WidgetSettings = settingsLoader ? defineAsyncComponent(settingsLoader) : null

const settingsOpen = ref(false)
const deleteOpen = ref(false)

const items = computed<DropdownMenuItem[]>(() => [
  // F-WGT-04: only types with settings have this item
  ...(WidgetSettings
    ? [
        {
          label: t('widgets.menu.settings'),
          icon: 'i-lucide-settings',
          onSelect: () => (settingsOpen.value = true),
        },
      ]
    : []),
  // F-WGT-06: a widget of an unknown type can still be deleted
  {
    label: t('widgets.menu.delete'),
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => (deleteOpen.value = true),
  },
])

function saveSettings(config: Record<string, unknown>) {
  updateConfig({ id: props.widget.id, contextId: props.widget.contextId, config })
  settingsOpen.value = false
}

// F-WGT-03
function confirmDelete() {
  deleteWidget({ id: props.widget.id, contextId: props.widget.contextId })
  deleteOpen.value = false
}
</script>

<template>
  <UDropdownMenu v-model:open="menuOpen" :items="items" :content="{ align: 'end' }">
    <UButton
      icon="i-lucide-ellipsis"
      :aria-label="t('widgets.menu.open')"
      color="neutral"
      variant="ghost"
      size="xs"
    />
  </UDropdownMenu>

  <UModal v-if="WidgetSettings" v-model:open="settingsOpen" :title="t('widgets.settings.title')">
    <template #body>
      <component :is="WidgetSettings" :widget="widget" @save="saveSettings" />
    </template>
  </UModal>

  <UModal
    v-model:open="deleteOpen"
    :title="t('widgets.delete.title', { name })"
    :description="t('widgets.delete.description')"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          :label="t('widgets.delete.cancel')"
          color="neutral"
          variant="outline"
          @click="deleteOpen = false"
        />
        <UButton :label="t('widgets.delete.confirm')" color="error" @click="confirmDelete" />
      </div>
    </template>
  </UModal>
</template>
