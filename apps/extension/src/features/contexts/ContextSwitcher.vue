<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ contexts: ContextDto[]; active: ContextDto }>()
const emit = defineEmits<{ manage: [] }>()
const { t } = useI18n()
const ui = useUiStore()

const items = computed<TabsItem[]>(() =>
  props.contexts.map((context) => ({ label: context.name, icon: context.icon, value: context.id })),
)
</script>

<template>
  <div class="flex min-w-0 items-center gap-1">
    <UTabs
      :items="items"
      :model-value="active.id"
      :content="false"
      variant="link"
      :ui="{ root: 'items-start', list: 'w-max', trigger: 'shrink-0' }"
      class="min-w-0 overflow-x-auto"
      @update:model-value="(id: string | number) => void ui.selectContext(String(id))"
    />
    <UButton
      icon="i-lucide-pencil"
      :aria-label="t('contexts.manage.open')"
      color="neutral"
      variant="ghost"
      @click="emit('manage')"
    />
  </div>
</template>
