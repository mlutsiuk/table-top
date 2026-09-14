import type { Component } from 'vue'
import type { FieldType } from '../../shared/types'
import NumberInput from './NumberInput.vue'
import TextInput from './TextInput.vue'
import BooleanInput from './BooleanInput.vue'

/**
 * The control used to edit a value of each field type.
 *
 * Mirrors `FIELD_TYPES` in `shared/fields`, and is a `Record<FieldType, …>` for
 * the same reason: adding a field type stops this compiling until it has a
 * control, so a type can never be half-added.
 *
 * Used twice — for the `default` in the config editor, and for the value itself
 * on an asset trait — because those are the same question asked in two places.
 */
export const FIELD_INPUTS: Record<FieldType, Component> = {
  number: NumberInput,
  text: TextInput,
  boolean: BooleanInput
}

/** What a freshly added field of each type starts as. */
export const FIELD_BLANK_DEFAULTS: Record<FieldType, number | string | boolean> = {
  number: 0,
  text: '',
  boolean: false
}
