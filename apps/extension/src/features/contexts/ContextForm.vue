<script setup lang="ts">
import { CONTEXT_ICONS, ContextFormSchema, type ContextFormInput } from '@one-place/shared'
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { formErrors } from '@/i18n/form-errors'
import IconPicker from './IconPicker.vue'

defineProps<{ submitLabel: string }>()
const emit = defineEmits<{ submit: [values: ContextFormInput] }>()

const { t } = useI18n()
const state = reactive<ContextFormInput>({ name: '', icon: CONTEXT_ICONS[0] })
const validate = formErrors(ContextFormSchema, t)

function onSubmit() {
  // parse() trims the name, the same way the API will
  emit('submit', ContextFormSchema.parse(state))
  state.name = ''
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="name" :label="t('contexts.fields.name')">
      <UInput
        v-model="state.name"
        :placeholder="t('contexts.fields.namePlaceholder')"
        autofocus
        class="w-full"
      />
    </UFormField>
    <UFormField name="icon" :label="t('contexts.fields.icon')">
      <IconPicker v-model="state.icon" />
    </UFormField>
    <UButton type="submit" :label="submitLabel" block />
  </UForm>
</template>
