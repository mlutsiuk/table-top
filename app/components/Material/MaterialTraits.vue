<script setup lang="ts">
import type { AssetTraitDto, TraitDefDto } from '~~/engine/traits/dto'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

/**
 * The trait definitions attached to one asset, and their values.
 *
 * Knows nothing about what a field is: the rows are drawn by the editor that owns
 * that knowledge. All this owns is the list, and what may be done to it.
 */

const props = defineProps<{
  assetId: string
  campaignId: string
}>()

const trpc = useTrpc()

/** Filling in a sheet is editing the material, so it follows the same rule. */
const editable = computed(() => can('materials:write'))

const traits = ref<AssetTraitDto[]>([])
const pending = ref(false)
const savingId = ref<string | null>(null)

async function fetchTraits() {
  pending.value = true
  try {
    traits.value = await trpc.assetTrait.list.query({ assetId: props.assetId })
  }
  catch (e) {
    notifyError(e, 'Could not load the traits')
  }
  finally {
    pending.value = false
  }
}

watch(() => props.assetId, fetchTraits, { immediate: true })

async function save(trait: AssetTraitDto, data: Record<string, unknown>) {
  savingId.value = trait.id
  try {
    const updated = await trpc.assetTrait.save.mutate({ id: trait.id, data })
    traits.value = traits.value.map(row => (row.id === updated.id ? updated : row))
  }
  catch (e) {
    notifyError(e, 'Could not save the values')
  }
  finally {
    savingId.value = null
  }
}

// --- Attaching ---

const addOpen = ref(false)
const traitDefs = ref<TraitDefDto[]>([])
const traitDefsPending = ref(false)
const attachingId = ref<string | null>(null)

/** What the campaign has that this asset is not already carrying. */
const attachable = computed(() => {
  const taken = new Set(traits.value.map(trait => trait.traitDef.id))

  return traitDefs.value.filter(traitDef => !taken.has(traitDef.id))
})

/** Fetched when the dialog opens rather than upfront, so the list is never stale. */
async function openAdd() {
  addOpen.value = true
  traitDefsPending.value = true
  try {
    traitDefs.value = await trpc.traitDef.list.query({ campaignId: props.campaignId })
  }
  catch (e) {
    notifyError(e, 'Could not load the campaign traits')
  }
  finally {
    traitDefsPending.value = false
  }
}

async function attach(traitDef: TraitDefDto) {
  attachingId.value = traitDef.id
  try {
    traits.value = [...traits.value, await trpc.assetTrait.attach.mutate({
      assetId: props.assetId,
      traitDefId: traitDef.id
    })].sort((a, b) => a.traitDef.label.localeCompare(b.traitDef.label))
    addOpen.value = false
  }
  catch (e) {
    notifyError(e, 'Could not add the trait')
  }
  finally {
    attachingId.value = null
  }
}

// --- Detaching ---

const detaching = ref<AssetTraitDto | null>(null)

async function detach() {
  if (!detaching.value) return

  const id = detaching.value.id
  try {
    await trpc.assetTrait.detach.mutate({ id })
    traits.value = traits.value.filter(trait => trait.id !== id)
    detaching.value = null
  }
  catch (e) {
    notifyError(e, 'Could not remove the trait')
  }
}
</script>

<template>
  <!-- Nothing to show and nothing to add is no panel at all, rather than an empty one. -->
  <div
    v-if="editable || traits.length > 0"
    class="flex flex-col gap-4 p-4"
  >
    <div class="flex flex-row items-center justify-between gap-2">
      <h3 class="text-sm font-semibold">
        Traits
      </h3>
      <Button
        v-if="editable"
        variant="ghost"
        size="icon-sm"
        title="Add a trait"
        @click="openAdd"
      >
        <Icon name="lucide:plus" class="size-4" />
      </Button>
    </div>

    <div v-if="pending" class="flex justify-center py-6">
      <Loader class="size-5" />
    </div>

    <p
      v-else-if="traits.length === 0"
      class="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground"
    >
      No traits on this asset yet. Add one to give it stats.
    </p>

    <div
      v-for="trait in traits"
      :key="trait.id"
      class="flex flex-col gap-3 rounded-lg border border-border p-3"
    >
      <div class="flex flex-row items-center justify-between gap-2">
        <span class="min-w-0 truncate text-sm font-medium">{{ trait.traitDef.label }}</span>
        <Button
          v-if="editable"
          variant="ghost"
          size="icon-sm"
          title="Remove from this asset"
          @click="detaching = trait"
        >
          <Icon name="lucide:trash-2" class="size-4 text-destructive" />
        </Button>
      </div>

      <!-- A config this build cannot read leaves nothing to draw: the fields are
           exactly what it would have described. -->
      <p
        v-if="!trait.traitDef.valid"
        class="text-xs text-muted-foreground"
      >
        This definition's configuration cannot be read, so its values cannot be shown.
      </p>

      <TraitEditor
        v-else
        :config="trait.traitDef.config"
        :data="trait.data"
        :editable="editable"
        :saving="savingId === trait.id"
        @save="(data: Record<string, unknown>) => save(trait, data)"
      />
    </div>

    <!-- Add -->
    <Dialog :open="addOpen" @update:open="val => (addOpen = val)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a trait</DialogTitle>
          <DialogDescription>
            Everything this campaign has, minus what this asset already carries.
          </DialogDescription>
        </DialogHeader>

        <div v-if="traitDefsPending" class="flex justify-center py-6">
          <Loader class="size-5" />
        </div>

        <p
          v-else-if="attachable.length === 0"
          class="py-4 text-center text-sm text-muted-foreground"
        >
          Nothing left to add. New traits are created on the Traits page of the campaign.
        </p>

        <div v-else class="flex flex-col gap-2">
          <button
            v-for="traitDef in attachable"
            :key="traitDef.id"
            type="button"
            class="rounded-lg border border-border px-3 py-2.5 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            :disabled="attachingId !== null"
            @click="attach(traitDef)"
          >
            <span class="text-sm font-medium">{{ traitDef.label }}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Detach -->
    <Dialog :open="!!detaching" @update:open="val => !val && (detaching = null)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove this trait?</DialogTitle>
          <DialogDescription>
            <template v-if="detaching">
              Everything this asset has stored for
              <span class="font-medium text-foreground">{{ detaching.traitDef.label }}</span>
              goes with it. The trait itself stays in the campaign.
            </template>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="detaching = null">
            Cancel
          </Button>
          <Button variant="destructive" @click="detach">
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
