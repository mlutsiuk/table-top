<script setup lang="ts">
import type { MechanicConfigImpact } from '#shared/types/mechanic'
import type { MechanicDto } from '~~/engine/mechanics/dto'
import type { ValuesConfig } from '~~/engine/mechanics/values-v1'
import ConfigEditor from '~~/engine/mechanics/values-v1/ui/ConfigEditor.vue'
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

const route = useRoute('campaigns-id-mechanics-mechanicId')
const campaignId = computed(() => route.params.id)
const mechanicId = computed(() => route.params.mechanicId)
const trpc = useTrpc()

const mechanic = ref<MechanicDto | null>(null)
const pending = ref(false)
const saving = ref(false)

async function fetchMechanic() {
  pending.value = true
  try {
    const mechanics = await trpc.mechanic.list.query({ campaignId: campaignId.value })
    mechanic.value = mechanics.find(item => item.id === mechanicId.value) ?? null
  }
  catch (e) {
    notifyError(e, 'Could not load the mechanic')
  }
  finally {
    pending.value = false
  }
}

onMounted(fetchMechanic)

// --- Saving, with a warning when it would destroy values ---

const pendingConfig = ref<ValuesConfig | null>(null)
const impact = ref<MechanicConfigImpact | null>(null)

async function requestSave(config: ValuesConfig) {
  saving.value = true
  try {
    const next = await trpc.mechanic.configImpact.query({ id: mechanicId.value, config })

    if (next.removedKeys.length > 0) {
      // Ask before destroying anything: the master gets the scale, not a shrug.
      pendingConfig.value = config
      impact.value = next
      return
    }

    await commit(config)
  }
  catch (e) {
    notifyError(e, 'Could not check the change')
  }
  finally {
    saving.value = false
  }
}

async function commit(config: ValuesConfig) {
  saving.value = true
  try {
    mechanic.value = await trpc.mechanic.updateConfig.mutate({ id: mechanicId.value, config })
    impact.value = null
    pendingConfig.value = null
  }
  catch (e) {
    notifyError(e, 'Could not save the mechanic')
  }
  finally {
    saving.value = false
  }
}

function cancelDestructive() {
  impact.value = null
  pendingConfig.value = null
}
</script>

<template>
  <div class="flex max-w-3xl flex-col gap-6 px-8 py-6">
    <div>
      <NuxtLink
        :to="{ name: 'campaigns-id-mechanics', params: { id: campaignId } }"
        class="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Icon name="lucide:chevron-left" class="size-3.5" />
        Mechanics
      </NuxtLink>

      <h2 class="text-base font-semibold">
        {{ mechanic?.name ?? '…' }}
      </h2>
      <p class="text-sm text-muted-foreground">
        Fields every asset using this mechanic can fill in.
      </p>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <Loader class="size-6" />
    </div>

    <p
      v-else-if="!mechanic"
      class="text-sm text-muted-foreground"
    >
      This mechanic no longer exists.
    </p>

    <template v-else>
      <p
        v-if="!mechanic.valid"
        class="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-muted-foreground"
      >
        The stored configuration is not something this build can read — it may have
        been edited by hand, or left behind by a change to the field types. Saving
        from here replaces it.
      </p>

      <ConfigEditor
        :config="mechanic.valid ? mechanic.config : null"
        :saving="saving"
        @save="requestSave"
      />
    </template>
  </div>

  <!-- Destructive change -->
  <Dialog :open="!!impact" @update:open="val => !val && cancelDestructive()">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>This will delete stored values</DialogTitle>
        <DialogDescription>
          <template v-if="impact">
            Removing
            <span class="font-medium text-foreground">
              {{ impact.removedKeys.map(key => `"${key}"`).join(', ') }}
            </span>
            will erase what
            <span class="font-medium text-foreground">
              {{ impact.affectedAssets }}
            </span>
            {{ impact.affectedAssets === 1 ? 'asset has' : 'assets have' }} stored for
            {{ impact.removedKeys.length === 1 ? 'it' : 'them' }}. This cannot be undone.
          </template>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="cancelDestructive">
          Cancel
        </Button>
        <Button
          variant="destructive"
          :loading="saving"
          @click="pendingConfig && commit(pendingConfig)"
        >
          Delete and save
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
