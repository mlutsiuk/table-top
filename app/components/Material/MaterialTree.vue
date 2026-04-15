<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport, TreeItem, TreeRoot } from 'reka-ui'

const items = (() => {
  const res = [
    {
      title: 'composables',
      icon: 'lucide:folder',
      children: [
        { title: 'useAuth.ts', icon: 'vscode-icons:file-type-typescript' },
        { title: 'useUser.ts', icon: 'vscode-icons:file-type-typescript' }
      ]
    },
    {
      title: 'components',
      icon: 'lucide:folder',
      children: [
        {
          title: 'Home',
          icon: 'lucide:folder',
          children: [
            { title: 'Card.vue', icon: 'vscode-icons:file-type-vue' },
            { title: 'Button.vue', icon: 'vscode-icons:file-type-vue' }
          ]
        }
      ]
    }
  ] as Record<string, any>[]

  for (let i = 0; i < 25; i++) {
    res.push({
      title: `Folder ${i}`,
      icon: 'lucide:folder',
      children: [
        { title: 'file1.ts', icon: 'vscode-icons:file-type-typescript' },
        { title: 'file2.ts', icon: 'vscode-icons:file-type-typescript' }
      ]
    })
  }

  res.push({ title: 'app.vue', icon: 'vscode-icons:file-type-vue' })
  res.push({ title: 'nuxt.config.ts', icon: 'vscode-icons:file-type-nuxt' })

  return res
})()
</script>

<template>
  <ScrollAreaRoot
    class="h-[225px] overflow-hidden"
    style="--scrollbar-size: 10px"
  >
    <ScrollAreaViewport class="size-full rounded">
      <TreeRoot
        v-slot="{ flattenItems }"
        class="select-none list-none bg-sidebar p-2 text-sm font-medium text-sidebar-foreground"
        :items="items"
        :get-key="(item) => item.title"
      >
        <h2 class="px-2 text-base! font-semibold text-sidebar-foreground">
          Materials
        </h2>

        <TreeItem
          v-for="item in flattenItems"
          v-slot="{ isExpanded }"
          :key="item._id"
          :style="{ 'padding-left': `${item.level - 0.5}rem` }"
          v-bind="item.bind"
          class="my-0.5 flex items-center rounded px-2 py-1 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-ring/50 focus-visible:ring-[3px] data-selected:bg-sidebar-accent data-selected:text-sidebar-accent-foreground"
        >
          <template v-if="item.hasChildren">
            <Icon
              v-if="!isExpanded"
              name="lucide:folder"
              class="size-4"
            />
            <Icon
              v-else
              name="lucide:folder-open"
              class="size-4"
            />
          </template>
          <Icon
            v-else
            :name="item.value.icon || 'lucide:file'"
            class="size-4"
          />
          <div class="pl-2">
            {{ item.value.title }}
          </div>
        </TreeItem>
      </TreeRoot>
    </ScrollAreaViewport>

    <ScrollAreaScrollbar
      class="flex touch-none select-none p-0.5 transition-colors duration-160 ease-out data-[orientation=vertical]:w-2.5"
      orientation="vertical"
    >
      <ScrollAreaThumb
        class="relative flex-1 rounded-[10px] bg-border before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"
      />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
