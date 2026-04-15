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
        class="select-none list-none bg-gray-800 p-2 text-sm font-medium text-gray-700 dark:text-gray-200"
        :items="items"
        :get-key="(item) => item.title"
      >
        <h2 class="px-2 text-base! font-semibold text-gray-700 dark:text-gray-200 ">
          Materials
        </h2>

        <TreeItem
          v-for="item in flattenItems"
          v-slot="{ isExpanded }"
          :key="item._id"
          :style="{ 'padding-left': `${item.level - 0.5}rem` }"
          v-bind="item.bind"
          class="my-0.5 flex items-center rounded px-2 py-1 outline-none focus:ring-1 data-selected:bg-[--ui-color-primary-900]"
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
      class="flex touch-none select-none bg-gray-700 p-0.5 transition-colors duration-160 ease-out hover:bg-gray-600 data-[orientation=vertical]:w-2.5"
      orientation="vertical"
    >
      <ScrollAreaThumb
        class="relative flex-1 rounded-[10px] bg-gray-400 before:absolute before:left-1/2 before:top-1/2 before:size-full before:min-h-11 before:min-w-11 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']"
      />
    </ScrollAreaScrollbar>
  </ScrollAreaRoot>
</template>
