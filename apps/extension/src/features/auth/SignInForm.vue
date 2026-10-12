<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { SignInSchema, type SignInInput } from '@one-place/shared'
import { authClient } from '@/api/auth-client'
import { formErrors } from '@/i18n/form-errors'
import { useAuthRequest } from './use-auth-request'

const emit = defineEmits<{ switch: [] }>()

const { t } = useI18n()
const state = reactive<SignInInput>({ email: '', password: '' })
const validate = formErrors(SignInSchema, t)
const { loading, errorKey, run } = useAuthRequest()

function onSubmit() {
  return run((options) => authClient.signIn.email(state, options))
}
</script>

<template>
  <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
    <UFormField name="email" :label="t('auth.fields.email')">
      <UInput v-model="state.email" type="email" autocomplete="email" class="w-full" />
    </UFormField>
    <UFormField name="password" :label="t('auth.fields.password')">
      <UInput
        v-model="state.password"
        type="password"
        autocomplete="current-password"
        class="w-full"
      />
    </UFormField>
    <UAlert v-if="errorKey" color="error" variant="subtle" :title="t(errorKey)" />
    <UButton type="submit" :label="t('auth.signIn.submit')" :loading="loading" block />
    <p class="text-center text-sm text-muted">
      {{ t('auth.signIn.switch') }}
      <UButton variant="link" :label="t('auth.signIn.switchAction')" @click="emit('switch')" />
    </p>
  </UForm>
</template>
