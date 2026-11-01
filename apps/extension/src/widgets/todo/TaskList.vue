<script setup lang="ts">
import { TODO_TEXT_MAX_LENGTH } from '@one-place/shared'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { type DraggableEvent, VueDraggable } from 'vue-draggable-plus'
import { useI18n } from 'vue-i18n'
import type { TaskItem, TaskSource } from './task-source'

// Only shows the tasks and reports what the user did. Where the tasks come from is the business
// of TodoWidget and its TaskSource, so this component is tested without the API.
const props = defineProps<{ items: TaskItem[]; capabilities: TaskSource['capabilities'] }>()
const emit = defineEmits<{
  add: [text: string]
  toggle: [id: string]
  edit: [id: string, text: string]
  remove: [id: string]
  move: [id: string, beforeId: string | null, afterId: string | null]
}>()

const { t } = useI18n()

// VueDraggable reorders this copy while dragging. The cache changes only after the drop.
const rows = ref<TaskItem[]>([])
watch(
  () => props.items,
  (items) => (rows.value = [...items]),
  { immediate: true },
)

// F-TODO-05: `rows` is already in the new order. The source gets the new neighbours, because
// the list may not show every task (hidden completed ones).
function onMove(event: DraggableEvent<TaskItem>) {
  const index = event.newIndex
  const moved = index === undefined ? undefined : rows.value[index]
  if (index === undefined || !moved) return
  emit('move', moved.id, rows.value[index - 1]?.id ?? null, rows.value[index + 1]?.id ?? null)
}

const newText = ref('')
const list = useTemplateRef('list')
let scrollToNew = false

// F-TODO-01: Enter adds the trimmed text at the end, an empty one is ignored
function add() {
  const text = newText.value.trim()
  if (!text) return
  emit('add', text)
  newText.value = ''
  scrollToNew = true
}

// F-TODO-03: one task at a time is edited in place
const editingId = ref<string | null>(null)
const editText = ref('')

function startEdit(item: TaskItem) {
  editingId.value = item.id
  editText.value = item.text
}

// Enter and Escape close the field, and the browser then reports a blur as well. Clearing
// editingId first makes that second call do nothing.
function finishEdit(save: boolean) {
  const id = editingId.value
  if (id === null) return
  editingId.value = null
  const text = editText.value.trim()
  const item = props.items.find((task) => task.id === id)
  // An empty text cancels the edit, like Escape
  if (save && text && item && text !== item.text) emit('edit', id, text)
}

// The new task appears after the optimistic update, so the list scrolls when it gets longer
watch(
  () => props.items.length,
  async () => {
    if (!scrollToNew) return
    scrollToNew = false
    await nextTick()
    list.value?.scrollTo({ top: list.value.scrollHeight })
  },
)
</script>

<template>
  <div class="flex h-full flex-col gap-2">
    <!-- F-TODO-07 -->
    <p v-if="items.length === 0" class="flex-1 text-sm text-muted">{{ t('widgets.todo.empty') }}</p>
    <div v-else ref="list" class="-mx-1 min-h-0 flex-1 overflow-y-auto">
      <VueDraggable
        v-model="rows"
        tag="ul"
        handle=".task-drag-handle"
        :disabled="!capabilities.reorder"
        :animation="150"
        @update="onMove"
      >
        <li
          v-for="item in rows"
          :key="item.id"
          class="group flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-elevated"
        >
          <UIcon
            v-if="capabilities.reorder"
            name="i-lucide-grip-vertical"
            class="task-drag-handle size-4 shrink-0 cursor-grab text-dimmed opacity-0 group-hover:opacity-100"
            :aria-label="t('widgets.todo.drag')"
          />
          <!-- F-TODO-02 -->
          <UCheckbox
            :model-value="item.done"
            :aria-label="t('widgets.todo.toggle')"
            @update:model-value="emit('toggle', item.id)"
          />
          <UInput
            v-if="editingId === item.id"
            v-model="editText"
            :aria-label="t('widgets.todo.edit')"
            :maxlength="TODO_TEXT_MAX_LENGTH"
            size="sm"
            autofocus
            class="min-w-0 flex-1"
            @keydown.enter="finishEdit(true)"
            @keydown.esc="finishEdit(false)"
            @blur="finishEdit(true)"
          />
          <button
            v-else
            type="button"
            class="min-w-0 flex-1 cursor-text text-start text-sm break-words"
            :class="{ 'text-muted line-through': item.done }"
            @click="startEdit(item)"
          >
            {{ item.text }}
          </button>
          <!-- F-TODO-04: without a confirmation -->
          <UButton
            icon="i-lucide-x"
            :aria-label="t('widgets.todo.delete')"
            color="neutral"
            variant="ghost"
            size="xs"
            class="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
            @click="emit('remove', item.id)"
          />
        </li>
      </VueDraggable>
    </div>
    <UInput
      v-model="newText"
      icon="i-lucide-plus"
      :placeholder="t('widgets.todo.add')"
      :aria-label="t('widgets.todo.add')"
      :maxlength="TODO_TEXT_MAX_LENGTH"
      size="sm"
      class="w-full shrink-0"
      @keydown.enter="add"
    />
  </div>
</template>
