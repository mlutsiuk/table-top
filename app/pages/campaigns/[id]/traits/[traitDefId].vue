<script setup lang="ts">
import type { TraitConfigImpact } from '#shared/types/trait'
import type { TraitDefDto } from '~~/engine/traits/dto'
import type { TraitConfig } from '~~/engine/traits'
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

const route = useRoute('campaigns-id-traits-traitDefId')
const campaignId = computed(() => route.params.id)
const traitDefId = computed(() => route.params.traitDefId)
const trpc = useTrpc()

const traitDef = ref<TraitDefDto | null>(null)
const pending = ref(false)
const saving = ref(false)

async function fetchTraitDef() {
  pending.value = true
  try {
    const traitDefs = await trpc.traitDef.list.query({ campaignId: campaignId.value })
    traitDef.value = traitDefs.find(item => item.id === traitDefId.value) ?? null
  }
  catch (e) {
    notifyError(e, 'Could not load the trait')
  }
  finally {
    pending.value = false
  }
}

onMounted(fetchTraitDef)

// --- Saving, with a warning when it would destroy values ---

const pendingConfig = ref<TraitConfig | null>(null)
const impact = ref<TraitConfigImpact | null>(null)

async function requestSave(config: TraitConfig) {
  saving.value = true
  try {
    const next = await trpc.traitDef.configImpact.query({ id: traitDefId.value, config })

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

async function commit(config: TraitConfig) {
  saving.value = true
  try {
    traitDef.value = await trpc.traitDef.updateConfig.mutate({ id: traitDefId.value, config })
    impact.value = null
    pendingConfig.value = null
  }
  catch (e) {
    notifyError(e, 'Could not save the trait')
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
        :to="{ name: 'campaigns-id-traits', params: { id: campaignId } }"
        class="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <Icon name="lucide:chevron-left" class="size-3.5" />
        Traits
      </NuxtLink>

      <h2 class="text-base font-semibold">
        {{ traitDef?.label ?? '…' }}
        <span
          v-if="traitDef"
          class="ml-1 font-mono text-sm font-normal text-muted-foreground"
        >@{{ traitDef.key }}</span>
      </h2>
      <p class="text-sm text-muted-foreground">
        Fields every asset carrying this trait can fill in.
      </p>
    </div>

    <div v-if="pending" class="flex justify-center py-10">
      <Loader class="size-6" />
    </div>

    <p
      v-else-if="!traitDef"
      class="text-sm text-muted-foreground"
    >
      This trait no longer exists.
    </p>

    <template v-else>
      <p
        v-if="!traitDef.valid"
        class="rounded-lg border border-destructive/40 px-4 py-3 text-sm text-muted-foreground"
      >
        The stored configuration is not something this build can read — it may have
        been edited by hand, or left behind by a change to the field types. Saving
        from here replaces it.
      </p>

      <TraitConfigEditor
        :config="traitDef.valid ? traitDef.config : null"
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
