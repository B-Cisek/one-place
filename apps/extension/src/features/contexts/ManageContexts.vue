<script setup lang="ts">
import type { ContextDto } from '@one-place/shared'
import { ref, watch } from 'vue'
import { VueDraggable, type DraggableEvent } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import { useContexts, useDeleteContext, useUpdateContext } from '@/queries/contexts'
import ContextForm from './ContextForm.vue'
import ContextRow from './ContextRow.vue'
import { positionAt } from './positions'
import { useAddContext } from './use-add-context'

const { t } = useI18n()
const { data: contexts } = useContexts()
const { mutate: update } = useUpdateContext()
const { mutate: remove } = useDeleteContext()
const addContext = useAddContext()

// VueDraggable reorders this copy while dragging. The cache changes only after the drop.
const items = ref<ContextDto[]>([])
watch(contexts, (list) => (items.value = [...(list ?? [])]), { immediate: true })

function onMove(event: DraggableEvent<ContextDto>) {
  const index = event.newIndex
  const moved = index === undefined ? undefined : items.value[index]
  if (index === undefined || !moved) return
  update({ id: moved.id, position: positionAt(items.value, index) })
}

const toDelete = ref<ContextDto | null>(null)

function onDeleteModalOpen(open: boolean) {
  if (!open) toDelete.value = null
}

function confirmDelete() {
  if (toDelete.value) remove(toDelete.value.id)
  toDelete.value = null
}
</script>

<template>
  <div class="space-y-6">
    <VueDraggable
      v-model="items"
      tag="ul"
      handle=".drag-handle"
      :animation="150"
      class="space-y-2"
      @update="onMove"
    >
      <ContextRow
        v-for="context in items"
        :key="context.id"
        :context="context"
        @delete="toDelete = context"
      />
    </VueDraggable>
    <USeparator :label="t('contexts.manage.add')" />
    <ContextForm :submit-label="t('contexts.manage.add')" @submit="addContext" />

    <UModal
      :open="toDelete !== null"
      :title="t('contexts.delete.title', { name: toDelete?.name ?? '' })"
      :description="t('contexts.delete.description')"
      @update:open="onDeleteModalOpen"
    >
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            :label="t('contexts.delete.cancel')"
            color="neutral"
            variant="outline"
            @click="toDelete = null"
          />
          <UButton :label="t('contexts.delete.confirm')" color="error" @click="confirmDelete" />
        </div>
      </template>
    </UModal>
  </div>
</template>
