<script setup lang="ts">
import type { AssetTraitDto, MechanicDto } from '~~/engine/mechanics/dto'
import TraitEditor from '~~/engine/mechanics/values-v1/ui/TraitEditor.vue'
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
const mechanics = ref<MechanicDto[]>([])
const mechanicsPending = ref(false)
const attachingId = ref<string | null>(null)

/** What the campaign has that this asset is not already carrying. */
const attachable = computed(() => {
  const taken = new Set(traits.value.map(trait => trait.mechanic.id))

  return mechanics.value.filter(mechanic => !taken.has(mechanic.id))
})

/** Fetched when the dialog opens rather than upfront, so the list is never stale. */
async function openAdd() {
  addOpen.value = true
  mechanicsPending.value = true
  try {
    mechanics.value = await trpc.mechanic.list.query({ campaignId: props.campaignId })
  }
  catch (e) {
    notifyError(e, 'Could not load the campaign mechanics')
  }
  finally {
    mechanicsPending.value = false
  }
}

async function attach(mechanic: MechanicDto) {
  attachingId.value = mechanic.id
  try {
    traits.value = [...traits.value, await trpc.assetTrait.attach.mutate({
      assetId: props.assetId,
      mechanicId: mechanic.id
    })].sort((a, b) => a.mechanic.name.localeCompare(b.mechanic.name))
    addOpen.value = false
  }
  catch (e) {
    notifyError(e, 'Could not add the mechanic')
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
    notifyError(e, 'Could not remove the mechanic')
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
        title="Add a mechanic"
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
      No mechanics on this asset yet. Add one to give it stats.
    </p>

    <div
      v-for="trait in traits"
      :key="trait.id"
      class="flex flex-col gap-3 rounded-lg border border-border p-3"
    >
      <div class="flex flex-row items-center justify-between gap-2">
        <span class="min-w-0 truncate text-sm font-medium">{{ trait.mechanic.name }}</span>
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
        v-if="!trait.mechanic.valid"
        class="text-xs text-muted-foreground"
      >
        This definition's configuration cannot be read, so its values cannot be shown.
      </p>

      <TraitEditor
        v-else
        :config="trait.mechanic.config"
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
          <DialogTitle>Add a mechanic</DialogTitle>
          <DialogDescription>
            Everything this campaign has, minus what this asset already carries.
          </DialogDescription>
        </DialogHeader>

        <div v-if="mechanicsPending" class="flex justify-center py-6">
          <Loader class="size-5" />
        </div>

        <p
          v-else-if="attachable.length === 0"
          class="py-4 text-center text-sm text-muted-foreground"
        >
          Nothing left to add. New mechanics are created in the campaign settings.
        </p>

        <div v-else class="flex flex-col gap-2">
          <button
            v-for="mechanic in attachable"
            :key="mechanic.id"
            type="button"
            class="rounded-lg border border-border px-3 py-2.5 text-left transition-colors outline-none hover:bg-accent/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            :disabled="attachingId !== null"
            @click="attach(mechanic)"
          >
            <span class="text-sm font-medium">{{ mechanic.name }}</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Detach -->
    <Dialog :open="!!detaching" @update:open="val => !val && (detaching = null)">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Remove this mechanic?</DialogTitle>
          <DialogDescription>
            <template v-if="detaching">
              Everything this asset has stored for
              <span class="font-medium text-foreground">{{ detaching.mechanic.name }}</span>
              goes with it. The mechanic itself stays in the campaign.
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
