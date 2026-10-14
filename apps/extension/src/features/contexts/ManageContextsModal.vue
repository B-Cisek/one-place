<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ManageContexts from './ManageContexts.vue'

const open = defineModel<boolean>('open', { required: true })
const { t } = useI18n()
</script>

<template>
  <UModal v-model:open="open" :title="t('contexts.manage.title')">
    <template #body>
      <ManageContexts />
    </template>
  </UModal>
</template>
