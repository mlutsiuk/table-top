<script setup lang="ts">
import type { User } from '@prisma/client';

const props = defineProps<{
  user: Pick<User, 'name'>
}>()

const initials = computed(() => generateInitials(props.user.name, {
  maxLetters: 2
}))
</script>

<template>
  <Avatar>
    <!-- <AvatarImage src="https://github.com/shadcn.png" /> -->
    <AvatarFallback>{{ initials }}</AvatarFallback>
  </Avatar>
</template>