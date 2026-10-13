<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { ContextDto } from '@one-place/shared'
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui'

const props = defineProps<{ contexts: ContextDto[]; active: ContextDto }>()
const ui = useUiStore()

const items = computed<TabsItem[]>(() =>
  props.contexts.map((context) => ({ label: context.name, icon: context.icon, value: context.id })),
)
</script>

<template>
  <UTabs
    :items="items"
    :model-value="active.id"
    :content="false"
    variant="link"
    :ui="{ root: 'items-start', list: 'w-max', trigger: 'shrink-0' }"
    class="min-w-0 overflow-x-auto"
    @update:model-value="(id) => void ui.selectContext(String(id))"
  />
</template>
