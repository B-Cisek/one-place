<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { useI18n } from 'vue-i18n'
import { useWidgets } from '@/queries/widgets'
import DashboardGrid from './DashboardGrid.vue'

const props = defineProps<{ context: ContextDto }>()
const { t } = useI18n()
const { data: widgets, isError, refetch } = useWidgets(() => props.context.id)
</script>

<template>
  <!-- F-SYNC-02: the widgets of this context are not in the cache yet -->
  <template v-if="!widgets">
    <UAlert
      v-if="isError"
      color="error"
      variant="subtle"
      icon="i-lucide-cloud-off"
      :title="t('dashboard.loadError')"
      :actions="[{ label: t('dashboard.retry'), onClick: () => void refetch() }]"
    />
    <div v-else class="grid gap-4 sm:grid-cols-3">
      <USkeleton v-for="n in 3" :key="n" class="h-40" />
    </div>
  </template>
  <UEmpty
    v-else-if="widgets.length === 0"
    :icon="context.icon"
    :title="context.name"
    :description="t('dashboard.empty')"
    class="mt-16"
  />
  <DashboardGrid v-else :widgets="widgets" />
</template>
