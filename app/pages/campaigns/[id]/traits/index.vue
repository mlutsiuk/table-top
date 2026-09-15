<script setup lang="ts">
import type { TraitDefDto } from '~~/engine/traits/dto'
import { deriveTraitKey, traitKeySchema } from '~~/engine/traits'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

definePageMeta({
  middleware: requireCampaignAbility('traits:manage')
})

const route = useRoute('campaigns-id-traits')
const campaignId = computed(() => route.params.id)
const trpc = useTrpc()

const traitDefs = ref<TraitDefDto[]>([])
const pending = ref(false)

async function fetchAll() {
  pending.value = true
  try {
    traitDefs.value = await trpc.traitDef.list.query({ campaignId: campaignId.value })
  }
  catch (e) {
    notifyError(e, 'Could not load traits')
  }
  finally {
    pending.value = false
  }
}

onMounted(fetchAll)

// --- Add ---

const addOpen = ref(false)
const addLabel = ref('')
const addKey = ref('')
const adding = ref(false)

/**
 * The key follows the label until the master edits it by hand.
 *
 * After that it is theirs: re-deriving would silently overwrite a deliberate choice
 * the moment they fix a typo in the label.
 */
const keyTouched = ref(false)

watch(addLabel, (label) => {
  if (!keyTouched.value)
    addKey.value = deriveTraitKey(label)
})

/** The same schema the server checks with, so the form never promises a save it will refuse. */
const keyCheck = computed(() => traitKeySchema.safeParse(addKey.value))

const keyError = computed(() => {
  if (!addLabel.value.trim() && !keyTouched.value)
    return null
  if (!addKey.value)
    return 'Enter a key, the label has nothing to build one from'

  return keyCheck.value.success ? null : keyCheck.value.error.issues[0]?.message ?? 'Invalid key'
})

const canAdd = computed(() => addLabel.value.trim().length > 0 && keyCheck.value.success)

function openAdd() {
  addLabel.value = ''
  addKey.value = ''
  keyTouched.value = false
  addOpen.value = true
}

async function add() {
  if (!canAdd.value)
    return

  adding.value = true
  try {
    await trpc.traitDef.create.mutate({
      campaignId: campaignId.value,
      label: addLabel.value.trim(),
      key: addKey.value
    })
    addOpen.value = false
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not add the trait')
  }
  finally {
    adding.value = false
  }
}

// --- Rename ---

const renaming = ref<TraitDefDto | null>(null)
const renameValue = ref('')

function openRename(traitDef: TraitDefDto) {
  renaming.value = traitDef
  renameValue.value = traitDef.label
}

async function rename() {
  const label = renameValue.value.trim()
  if (!renaming.value || !label)
    return

  try {
    await trpc.traitDef.rename.mutate({ id: renaming.value.id, label })
    renaming.value = null
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not rename the trait')
  }
}

// --- Delete ---

const deleting = ref<TraitDefDto | null>(null)

async function remove() {
  if (!deleting.value)
    return

  try {
    await trpc.traitDef.delete.mutate({ id: deleting.value.id })
    deleting.value = null
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not delete the trait')
  }
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-6 px-8 py-6">
    <div class="flex flex-row items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold">
          Traits
        </h2>
        <p class="text-sm text-muted-foreground">
          What a character sheet in this campaign is made of. Each trait holds its own
          set of fields.
        </p>
      </div>

      <Button
        class="shrink-0"
        @click="openAdd"
      >
        <Icon name="lucide:plus" class="size-4" />
        Add trait
      </Button>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-10"
    >
      <Loader class="size-6" />
    </div>

    <p
      v-else-if="traitDefs.length === 0"
      class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      No traits yet. Add one to start describing what your assets hold.
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="traitDef in traitDefs"
        :key="traitDef.id"
        class="flex flex-row items-center gap-3 rounded-lg border border-border px-4 py-3"
      >
        <NuxtLink
          class="min-w-0 grow"
          :to="{ name: 'campaigns-id-traits-traitDefId', params: { id: campaignId, traitDefId: traitDef.id } }"
        >
          <div class="truncate text-sm font-medium hover:underline">
            {{ traitDef.label }}
          </div>
          <div class="truncate font-mono text-xs text-muted-foreground">
            @{{ traitDef.key }}
          </div>
        </NuxtLink>

        <Button
          variant="ghost"
          size="icon-sm"
          title="Rename"
          @click="openRename(traitDef)"
        >
          <Icon name="lucide:pencil" class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete"
          @click="deleting = traitDef"
        >
          <Icon name="lucide:trash-2" class="size-4 text-destructive" />
        </Button>
      </li>
    </ul>
  </div>

  <!-- Add -->
  <Dialog :open="addOpen" @update:open="val => (addOpen = val)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add a trait</DialogTitle>
        <DialogDescription>
          Give it a name you will recognise, like "Health" or "Core stats". Fields are
          added on the next screen.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="add">
        <div class="flex flex-col gap-1.5">
          <label for="add-trait-label" class="text-sm font-medium">Name</label>
          <Input
            id="add-trait-label"
            v-model="addLabel"
            placeholder="Health"
            autofocus
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="add-trait-key" class="text-sm font-medium">Key</label>
          <Input
            id="add-trait-key"
            v-model="addKey"
            placeholder="health"
            class="font-mono"
            :class="keyError ? 'border-destructive' : ''"
            @input="keyTouched = true"
          />
          <span
            v-if="keyError"
            class="text-xs text-destructive"
          >
            {{ keyError }}
          </span>
          <span
            v-else
            class="text-xs text-muted-foreground"
          >
            Formulas will use it as <span class="font-mono">@{{ addKey || 'key' }}</span>.
            It cannot be changed later.
          </span>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            @click="addOpen = false"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :loading="adding"
            :disabled="!canAdd"
          >
            Add
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Rename -->
  <Dialog :open="!!renaming" @update:open="val => !val && (renaming = null)">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Rename trait</DialogTitle>
        <DialogDescription v-if="renaming">
          The key stays <span class="font-mono text-foreground">@{{ renaming.key }}</span>,
          so nothing that refers to it breaks.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="rename">
        <Input
          id="rename-trait-label"
          v-model="renameValue"
          autofocus
        />
        <DialogFooter>
          <Button type="button" variant="outline" @click="renaming = null">
            Cancel
          </Button>
          <Button type="submit" :disabled="!renameValue.trim()">
            Rename
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>

  <!-- Delete -->
  <Dialog :open="!!deleting" @update:open="val => !val && (deleting = null)">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete trait</DialogTitle>
        <DialogDescription>
          <span class="font-medium text-foreground">"{{ deleting?.label }}"</span>
          and every value stored for it on your assets will be deleted. This cannot
          be undone.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="deleting = null">
          Cancel
        </Button>
        <Button variant="destructive" @click="remove">
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
