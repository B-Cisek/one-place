<script setup lang="ts">
import { TodoConfigSchema, type TodoConfig, type WidgetDto } from '@one-place/shared'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { formErrors } from '@/i18n/form-errors'
import { resolveConfig } from '../config'

const props = defineProps<{ widget: WidgetDto }>()
const emit = defineEmits<{ save: [config: TodoConfig] }>()

const { t } = useI18n()
const config = resolveConfig(TodoConfigSchema, props.widget.config)
const state = reactive({ title: config.title, hideCompleted: config.hideCompleted })
const validate = formErrors(TodoConfigSchema, t)

function onSubmit() {
  // The whole config is replaced, so the fields this form does not show are kept as they were
  emit('save', TodoConfigSchema.parse({ ...config, ...state }))
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField
      name="title"
      :label="t('widgets.todo.settings.title')"
      :help="t('widgets.todo.settings.titleHelp')"
    >
      <UInput
        v-model="state.title"
        :placeholder="t('widgets.todo.name')"
        autofocus
        class="w-full"
      />
    </UFormField>
    <UFormField name="hideCompleted">
      <USwitch v-model="state.hideCompleted" :label="t('widgets.todo.settings.hideCompleted')" />
    </UFormField>
    <UButton type="submit" :label="t('widgets.settings.save')" block />
  </UForm>
</template>
