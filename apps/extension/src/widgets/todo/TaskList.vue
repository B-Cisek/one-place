<script setup lang="ts">
import { TODO_TEXT_MAX_LENGTH } from '@one-place/shared'
import { nextTick, ref, useTemplateRef, watch } from 'vue'
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
      <ul>
        <li
          v-for="item in items"
          :key="item.id"
          class="group flex items-center gap-2 rounded-md px-1 py-1 hover:bg-elevated"
        >
          <!-- F-TODO-02 -->
          <UCheckbox
            :model-value="item.done"
            :aria-label="t('widgets.todo.toggle')"
            @update:model-value="emit('toggle', item.id)"
          />
          <span
            class="min-w-0 flex-1 text-sm break-words"
            :class="{ 'text-muted line-through': item.done }"
            >{{ item.text }}</span
          >
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
      </ul>
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
