import type { Component } from 'vue'
import type { FieldType, FieldValue } from '~~/engine/traits'
import BooleanInput from '@/components/Trait/fields/BooleanInput.vue'
import NumberInput from '@/components/Trait/fields/NumberInput.vue'
import TextInput from '@/components/Trait/fields/TextInput.vue'

/**
 * The control used to edit a value of each field type.
 *
 * Mirrors `FIELD_TYPES` in `engine/traits/fields`, and is a `Record<FieldType, …>`
 * for the same reason: adding a field type stops this compiling until it has a
 * control, so a type can never be half-added.
 *
 * Used twice, for the `default` in the config editor and for the value itself on an
 * asset trait, because those are the same question asked in two places.
 */
export const FIELD_INPUTS: Record<FieldType, Component> = {
  number: NumberInput,
  text: TextInput,
  boolean: BooleanInput
}

/** What a freshly added field of each type starts as. */
export const FIELD_BLANK_DEFAULTS: Record<FieldType, FieldValue> = {
  number: 0,
  text: '',
  boolean: false
}
