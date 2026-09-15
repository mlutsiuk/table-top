<script setup lang="ts">
import type { FieldType, TraitConfig } from '~~/engine/traits'
import { FIELD_TYPES, FIELD_TYPES_LIST, traitConfigSchema } from '~~/engine/traits'
import { FIELD_BLANK_DEFAULTS, FIELD_INPUTS } from '@/lib/trait-field-inputs'

/**
 * The master's editor for one trait definition.
 *
 * A component rather than part of the page: the page decides when to show it and
 * what to do with a save, while what a field is comes from `engine/traits`.
 *
 * The config arrives already typed: the API parsed it with the trait schema
 * and said so, so there is nothing left to check here. `null` means the stored row
 * could not be read at all — the page says as much, and editing starts empty.
 *
 * Edits a local copy and emits the whole config on save, so the page can ask the
 * server what a change would destroy before committing to it.
 */
/**
 * A field while it is being edited.
 *
 * Looser than the schema's `TraitField` on purpose: a field the master has just
 * added has an empty key and label, which the schema rightly refuses. Saving is
 * blocked until it would pass.
 */
type EditableField = {
  key: string
  label: string
  type: FieldType
  kind: 'static'
  default: number | string | boolean
}

const props = defineProps<{
  config: TraitConfig | null
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [config: TraitConfig]
}>()

function readFields(config: TraitConfig | null): EditableField[] {
  // `toRaw` first: the prop arrives as a reactive proxy, and `structuredClone`
  // refuses to clone a Proxy. The raw object underneath is plain data.
  return config ? structuredClone(toRaw(config).fields) : []
}

const fields = ref<EditableField[]>(readFields(props.config))

// The page reloads the definition after saving; take the server's version as truth.
watch(() => props.config, config => (fields.value = readFields(config)))

const dirty = computed(() =>
  JSON.stringify(fields.value) !== JSON.stringify(readFields(props.config))
)

/** Keys must be unique — the server refuses otherwise, so say it here first. */
const duplicateKeys = computed(() => {
  const seen = new Set<string>()
  const dupes = new Set<string>()

  for (const field of fields.value) {
    if (seen.has(field.key))
      dupes.add(field.key)
    seen.add(field.key)
  }

  return dupes
})

/**
 * The edited state, run through the real schema.
 *
 * Doubles as the validity check and as the value that gets emitted, so "can save"
 * means exactly "the schema accepts this" — there is no second set of rules here
 * to drift away from the first.
 */
const proposed = computed(() => traitConfigSchema.safeParse({ fields: fields.value }))

const canSave = computed(() => dirty.value && proposed.value.success)

function save() {
  if (proposed.value.success)
    emit('save', proposed.value.data)
}

function addField(type: FieldType) {
  fields.value.push({
    key: '',
    label: '',
    type,
    kind: 'static',
    default: FIELD_BLANK_DEFAULTS[type]
  })
}

function removeField(index: number) {
  fields.value.splice(index, 1)
}

/** Changing type invalidates the old default, so reset it rather than coerce. */
function changeType(field: EditableField, type: FieldType) {
  field.type = type
  field.default = FIELD_BLANK_DEFAULTS[type]
}

function reset() {
  fields.value = readFields(props.config)
}

// Name, Key, Type, Default — the delete button takes whatever is left over.
const { template, startResize } = useColumnWidths([200, 160, 210, 140])
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      v-if="fields.length === 0"
      class="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground"
    >
      No fields yet. Add one below — a number for Max HP, text for a description.
    </div>

    <div v-else class="overflow-x-auto rounded-lg border border-border">
      <div class="min-w-max">
        <!-- Header -->
        <div
          class="grid items-center border-b border-border bg-muted/40 text-xs font-medium text-muted-foreground"
          :style="{ gridTemplateColumns: template }"
        >
          <div
            v-for="(column, columnIndex) in ['Name', 'Key', 'Type', 'Default']"
            :key="column"
            class="relative px-3 py-2"
          >
            {{ column }}
            <!-- Drag handle sits on the boundary, widened for the pointer. -->
            <span
              class="absolute top-0 -right-1 z-10 h-full w-2 cursor-col-resize touch-none"
              @pointerdown.prevent="startResize(columnIndex, $event)"
            >
              <span class="absolute left-1/2 h-full w-px -translate-x-1/2 bg-border" />
            </span>
          </div>
          <div class="px-3 py-2" />
        </div>

        <!-- Rows -->
        <div
          v-for="(field, index) in fields"
          :key="index"
          class="grid items-start border-b border-border last:border-b-0 hover:bg-muted/20"
          :style="{ gridTemplateColumns: template }"
        >
          <div class="p-2">
            <Input v-model="field.label" placeholder="Max HP" />
          </div>

          <div class="p-2">
            <Input
              v-model="field.key"
              placeholder="max_hp"
              :class="duplicateKeys.has(field.key) ? 'border-destructive' : ''"
            />
            <span
              v-if="duplicateKeys.has(field.key)"
              class="mt-1 block text-xs text-destructive"
            >
              Already used
            </span>
          </div>

          <div class="flex flex-row gap-1 p-2">
            <Button
              v-for="type in FIELD_TYPES_LIST"
              :key="type"
              type="button"
              size="sm"
              :variant="field.type === type ? 'default' : 'outline'"
              @click="changeType(field, type)"
            >
              {{ FIELD_TYPES[type].label }}
            </Button>
          </div>

          <div class="p-2">
            <component
              :is="FIELD_INPUTS[field.type]"
              v-model="field.default"
            />
          </div>

          <div class="p-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Remove field"
              @click="removeField(index)"
            >
              <Icon name="lucide:trash-2" class="size-4 text-destructive" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-row items-center gap-2">
      <span class="text-xs text-muted-foreground">Add field:</span>
      <Button
        v-for="type in FIELD_TYPES_LIST"
        :key="type"
        type="button"
        variant="outline"
        size="sm"
        @click="addField(type)"
      >
        <Icon name="lucide:plus" class="size-3.5" />
        {{ FIELD_TYPES[type].label }}
      </Button>
    </div>

    <div
      v-if="dirty"
      class="flex flex-row items-center justify-end gap-2 border-t border-border pt-4"
    >
      <Button type="button" variant="outline" @click="reset">
        Discard
      </Button>
      <Button
        type="button"
        :loading="saving"
        :disabled="!canSave"
        @click="save"
      >
        Save changes
      </Button>
    </div>
  </div>
</template>
