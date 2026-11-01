<script setup lang="ts">
import { GRID_COLUMNS, type WidgetDto } from '@one-place/shared'
import { computed, defineAsyncComponent } from 'vue'
import { GRID_GAP, ROW_HEIGHT, widgetHeight } from './grid'
import { columnOrder, compactLayout } from './layout'
import { useNarrowScreen } from './use-narrow-screen'
import WidgetFrame from './WidgetFrame.vue'

const props = defineProps<{ contextId: string; widgets: WidgetDto[]; editMode: boolean }>()

// grid-layout-plus adds about 140 kB, needed only in edit mode
const GridEditor = defineAsyncComponent(() => import('./GridEditor.vue'))

// F-GRID-05: one column, in the reading order of the grid
const narrow = useNarrowScreen()

// The saved layout may have gaps (e.g. after a widget was deleted). The editor would close them,
// so the preview does the same.
const layout = computed(() => compactLayout(props.widgets))
const column = computed(() => columnOrder(layout.value))
</script>

<template>
  <div v-if="narrow" class="flex flex-col" :style="{ gap: `${GRID_GAP}px` }">
    <div
      v-for="widget in column"
      :key="widget.id"
      :style="{ height: `${widgetHeight(widget.h)}px` }"
    >
      <WidgetFrame :widget="widget" :edit-mode="false" />
    </div>
  </div>
  <GridEditor v-else-if="editMode" :context-id="contextId" :widgets="widgets" />
  <!-- The same geometry as grid-layout-plus: GRID_GAP around and between the cells -->
  <div
    v-else
    class="grid"
    :style="{
      gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
      gridAutoRows: `${ROW_HEIGHT}px`,
      gap: `${GRID_GAP}px`,
      padding: `${GRID_GAP}px`,
    }"
  >
    <div
      v-for="widget in layout"
      :key="widget.id"
      :style="{
        gridColumn: `${widget.x + 1} / span ${widget.w}`,
        gridRow: `${widget.y + 1} / span ${widget.h}`,
      }"
    >
      <WidgetFrame :widget="widget" :edit-mode="false" />
    </div>
  </div>
</template>
