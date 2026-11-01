<script setup lang="ts">
import { TodoConfigSchema, type WidgetDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveConfig } from '../config'
import TaskList from './TaskList.vue'
import { useTaskSource } from './task-source'

const props = defineProps<{ widget: WidgetDto }>()
const { t } = useI18n()
const config = computed(() => resolveConfig(TodoConfigSchema, props.widget.config))
// The source is chosen once. A change of the source in the config needs a new widget.
const source = useTaskSource(config.value.source, props.widget.id)

// F-TODO-06: a ticked task disappears at once when completed ones are hidden
const visible = computed(() =>
  config.value.hideCompleted
    ? source.items.value?.filter((item) => !item.done)
    : source.items.value,
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <h2 class="truncate pe-6 font-semibold text-highlighted">
      {{ config.title || t('widgets.todo.name') }}
    </h2>
    <!-- F-SYNC-02: the tasks of this widget are not in the cache yet -->
    <template v-if="!visible">
      <UEmpty
        v-if="source.isError.value"
        icon="i-lucide-cloud-off"
        :title="t('widgets.todo.loadError')"
        :actions="[{ label: t('widgets.todo.retry'), onClick: source.retry }]"
        variant="naked"
        size="sm"
      />
      <div v-else class="space-y-2">
        <USkeleton v-for="n in 3" :key="n" class="h-6" />
      </div>
    </template>
    <TaskList
      v-else
      :items="visible"
      :capabilities="source.capabilities"
      class="min-h-0 flex-1"
      @add="source.add"
      @toggle="source.toggle"
      @edit="source.edit"
      @remove="source.remove"
      @move="source.move"
    />
  </div>
</template>
