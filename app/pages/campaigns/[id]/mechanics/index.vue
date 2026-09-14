<script setup lang="ts">
import type { MechanicDto } from '~~/engine/mechanics/dto'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

definePageMeta({
  middleware: requireCampaignAbility('mechanics:manage')
})

const route = useRoute('campaigns-id-mechanics')
const campaignId = computed(() => route.params.id)
const trpc = useTrpc()

const mechanics = ref<MechanicDto[]>([])
const pending = ref(false)

async function fetchAll() {
  pending.value = true
  try {
    mechanics.value = await trpc.mechanic.list.query({ campaignId: campaignId.value })
  }
  catch (e) {
    notifyError(e, 'Could not load mechanics')
  }
  finally {
    pending.value = false
  }
}

onMounted(fetchAll)

// --- Add ---

const addOpen = ref(false)
const addName = ref('')
const adding = ref(false)

function openAdd() {
  addName.value = ''
  addOpen.value = true
}

async function add() {
  const name = addName.value.trim()
  if (!name) return

  adding.value = true
  try {
    await trpc.mechanic.create.mutate({
      campaignId: campaignId.value,
      name
    })
    addOpen.value = false
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not add the mechanic')
  }
  finally {
    adding.value = false
  }
}

// --- Rename ---

const renaming = ref<MechanicDto | null>(null)
const renameValue = ref('')

function openRename(mechanic: MechanicDto) {
  renaming.value = mechanic
  renameValue.value = mechanic.name
}

async function rename() {
  const name = renameValue.value.trim()
  if (!renaming.value || !name) return

  try {
    await trpc.mechanic.rename.mutate({ id: renaming.value.id, name })
    renaming.value = null
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not rename the mechanic')
  }
}

// --- Delete ---

const deleting = ref<MechanicDto | null>(null)

async function remove() {
  if (!deleting.value) return

  try {
    await trpc.mechanic.delete.mutate({ id: deleting.value.id })
    deleting.value = null
    await fetchAll()
  }
  catch (e) {
    notifyError(e, 'Could not delete the mechanic')
  }
}
</script>

<template>
  <div class="flex max-w-2xl flex-col gap-6 px-8 py-6">
    <div class="flex flex-row items-start justify-between gap-4">
      <div>
        <h2 class="text-base font-semibold">
          Mechanics
        </h2>
        <p class="text-sm text-muted-foreground">
          What a character sheet in this campaign is made of. Each mechanic holds its
          own set of fields.
        </p>
      </div>

      <Button
        class="shrink-0"
        @click="openAdd"
      >
        <Icon name="lucide:plus" class="size-4" />
        Add mechanic
      </Button>
    </div>

    <div
      v-if="pending"
      class="flex justify-center py-10"
    >
      <Loader class="size-6" />
    </div>

    <p
      v-else-if="mechanics.length === 0"
      class="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground"
    >
      No mechanics yet. Add one to start describing what your assets hold.
    </p>

    <ul
      v-else
      class="flex flex-col gap-2"
    >
      <li
        v-for="mechanic in mechanics"
        :key="mechanic.id"
        class="flex flex-row items-center gap-3 rounded-lg border border-border px-4 py-3"
      >
        <NuxtLink
          class="min-w-0 grow"
          :to="{ name: 'campaigns-id-mechanics-mechanicId', params: { id: campaignId, mechanicId: mechanic.id } }"
        >
          <div class="truncate text-sm font-medium hover:underline">
            {{ mechanic.name }}
          </div>
        </NuxtLink>

        <Button
          variant="ghost"
          size="icon-sm"
          title="Rename"
          @click="openRename(mechanic)"
        >
          <Icon name="lucide:pencil" class="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Delete"
          @click="deleting = mechanic"
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
        <DialogTitle>Add a mechanic</DialogTitle>
        <DialogDescription>
          Give it a name you will recognise — "health", "core stats". Fields are added
          on the next screen.
        </DialogDescription>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="add">
        <Input
          v-model="addName"
          placeholder="health"
          autofocus
        />

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
            :disabled="!addName.trim()"
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
        <DialogTitle>Rename mechanic</DialogTitle>
      </DialogHeader>

      <form class="flex flex-col gap-4" @submit.prevent="rename">
        <Input v-model="renameValue" autofocus />
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
        <DialogTitle>Delete mechanic</DialogTitle>
        <DialogDescription>
          <span class="font-medium text-foreground">"{{ deleting?.name }}"</span>
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
