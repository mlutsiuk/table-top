<script setup lang="ts">
// Imported explicitly rather than leaning on the host app's auto-imports: a
// mechanic is a self-contained unit, and its dependencies should be visible.
import { computed, ref, watch } from 'vue'
import { Button } from '@/components/ui/button'
import type { ValuesConfig } from '../shared/config.schema'
import type { ValuesTraitData } from '../shared/trait.schema'
import { assetTraitSchema, normalizeTraitData } from '../shared/trait.schema'
import { FIELD_INPUTS } from './fields'

/**
 * One asset's values for a `values-v1` instance.
 *
 * The same component whether it is being read or filled in: a player's view of a
 * sheet and a master's edit of it differ in what may be touched, not in what is on
 * it. `editable` drives that, and it defaults to off so a page that forgets to
 * pass it shows a sheet rather than handing out an edit.
 *
 * Edits a local copy and emits the whole trait on save, because that is what the
 * schema validates — a per-field patch would be checked against nothing.
 */

const props = defineProps<{
  config: ValuesConfig
  data: Record<string, unknown>
  editable?: boolean
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [data: Record<string, unknown>]
}>()

/**
 * What is stored, read through the config as it stands now.
 *
 * The trait may predate a field, or a field may have changed type under a value
 * already written; normalising here means the controls always get something they
 * can display, and the master sees the default they will save unless they change it.
 */
const stored = computed(() => normalizeTraitData(props.config, props.data))

const values = ref<ValuesTraitData>({ ...stored.value })

// The panel reloads the trait after saving; take the server's version as truth.
watch(stored, next => (values.value = { ...next }))

const dirty = computed(() =>
  JSON.stringify(values.value) !== JSON.stringify(stored.value)
)

/**
 * The edited state, run through the real trait schema — the same one the server
 * validates with, so "can save" means exactly "this will be accepted".
 */
const proposed = computed(() => assetTraitSchema(props.config).safeParse(values.value))

const canSave = computed(() => dirty.value && proposed.value.success)

function save() {
  if (proposed.value.success) emit('save', proposed.value.data)
}

function reset() {
  values.value = { ...stored.value }
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <p
      v-if="config.fields.length === 0"
      class="text-sm text-muted-foreground"
    >
      This mechanic has no fields yet, so there is nothing to fill in.
    </p>

    <div
      v-for="field in config.fields"
      v-else
      :key="field.key"
      class="grid grid-cols-2 items-center gap-3"
    >
      <label
        class="min-w-0 truncate text-sm text-muted-foreground"
        :title="field.label"
      >
        {{ field.label }}
      </label>

      <component
        :is="FIELD_INPUTS[field.type]"
        v-model="values[field.key]"
        :disabled="!editable || saving"
      />
    </div>

    <div
      v-if="editable && dirty"
      class="flex flex-row items-center justify-end gap-2"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        @click="reset"
      >
        Discard
      </Button>
      <Button
        type="button"
        size="sm"
        :loading="saving"
        :disabled="!canSave"
        @click="save"
      >
        Save
      </Button>
    </div>
  </div>
</template>
