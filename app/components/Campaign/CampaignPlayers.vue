<script setup lang="ts">
import type { CampaignRole } from '#shared/types/campaign'

const props = defineProps<{
  campaignId: string
  canManage: boolean
}>()

const trpc = useTrpc()

type Member = { id: string, name: string, email: string, role: CampaignRole }

const members = ref<Member[]>([])
const pending = ref(false)
const inviteEmail = ref('')
const inviting = ref(false)

async function fetchMembers() {
  pending.value = true
  try {
    members.value = await trpc.campaign.getMembers.query({ campaignId: props.campaignId })
  }
  catch (e) {
    notifyError(e, 'Could not load the players')
  }
  finally {
    pending.value = false
  }
}

async function invite() {
  const email = inviteEmail.value.trim()
  if (!email) return

  inviting.value = true
  try {
    await trpc.campaign.addPlayer.mutate({ campaignId: props.campaignId, email })
    inviteEmail.value = ''
    await fetchMembers()
  }
  catch (e) {
    notifyError(e, 'Could not add the player')
  }
  finally {
    inviting.value = false
  }
}

async function remove(userId: string) {
  try {
    await trpc.campaign.removePlayer.mutate({ campaignId: props.campaignId, userId })
    await fetchMembers()
  }
  catch (e) {
    notifyError(e, 'Could not remove the player')
  }
}

onMounted(fetchMembers)
</script>

<template>
  <div class="flex max-w-lg flex-col gap-5 py-2">
    <form
      v-if="canManage"
      class="flex flex-row gap-2"
      @submit.prevent="invite"
    >
      <Input
        v-model="inviteEmail"
        type="email"
        placeholder="player@example.com"
      />
      <Button
        type="submit"
        :loading="inviting"
      >
        Add player
      </Button>
    </form>

    <div
      v-if="pending"
      class="flex justify-center py-6"
    >
      <Loader class="size-6" />
    </div>

    <ul
      v-else
      class="flex flex-col gap-1"
    >
      <li
        v-for="member in members"
        :key="member.id"
        class="flex flex-row items-center gap-3 rounded-md border border-border px-3 py-2"
      >
        <UserAvatar :user="member" />

        <div class="min-w-0 grow">
          <div class="truncate text-sm font-medium">
            {{ member.name }}
          </div>
          <div class="truncate text-xs text-muted-foreground">
            {{ member.email }}
          </div>
        </div>

        <span class="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
          {{ member.role === 'master' ? 'Master' : 'Player' }}
        </span>

        <Button
          v-if="canManage && member.role !== 'master'"
          variant="ghost"
          size="icon-sm"
          title="Remove from campaign"
          @click="remove(member.id)"
        >
          <Icon name="lucide:user-minus" class="size-4" />
        </Button>
      </li>
    </ul>
  </div>
</template>
