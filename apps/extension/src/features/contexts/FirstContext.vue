<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ContextForm from './ContextForm.vue'
import { useAddContext } from './use-add-context'

const { t } = useI18n()
const addContext = useAddContext()
</script>

<template>
  <UCard class="mx-auto mt-16 w-full max-w-md">
    <template #header>
      <h1 class="text-xl font-semibold text-highlighted">{{ t('contexts.first.title') }}</h1>
      <p class="mt-1 text-sm text-muted">{{ t('contexts.first.description') }}</p>
    </template>
    <ContextForm :submit-label="t('contexts.first.submit')" @submit="addContext" />
  </UCard>
</template>
