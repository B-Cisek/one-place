<script setup lang="ts">
import { TodoConfigSchema, type WidgetDto } from '@one-place/shared'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveConfig } from '../config'

// A placeholder with the title only. The task list comes in Stage 4.
const props = defineProps<{ widget: WidgetDto }>()
const { t } = useI18n()
const config = computed(() => resolveConfig(TodoConfigSchema, props.widget.config))
</script>

<template>
  <h2 class="truncate font-semibold text-highlighted">
    {{ config.title || t('widgets.todo.name') }}
  </h2>
</template>
