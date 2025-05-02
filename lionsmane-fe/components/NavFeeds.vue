<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useFeedStore } from "@/stores/feedStore";
import { useArticleStore } from "@/stores/articleStore";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-vue-next";

const feedStore = useFeedStore();
const folderStore = useFolderStore();

const { feeds } = storeToRefs(feedStore);

const orphanFeeds = computed(() => {
  return feedStore.feeds.filter((feed) => !feed.folderId);
});
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>RSS</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible class="group/collapsible">
        <SidebarMenuItem>
          <SidebarMenuButton>
            <NuxtLink :to="{ name: 'dashboard-feeds-all' }">Feeds</NuxtLink>
          </SidebarMenuButton>
          <CollapsibleTrigger as-child>
            <SidebarMenuAction>
              <ChevronRight
                class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
              />
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <SidebarMenuButton
                v-for="feed in orphanFeeds"
                :key="feed.id!"
                as-child
                :tooltip="feed.title!"
              >
                <NuxtLink
                  :to="{
                    name: 'dashboard-feeds-id',
                    params: { id: feed.id! },
                  }"
                >
                  <!--              <component :is="feed.icon" />-->
                  <span>{{ feed.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
              <Collapsible v-for="folder in folders">
                <CollapsibleTrigger as-child>
                  <SidebarMenuButton>{{ folder.name }}</SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <template v-for="feed in feeds">
                    <SidebarMenuButton
                      v-if="feed.folderId === folder.id"
                      :key="feed.id!"
                      as-child
                      :tooltip="feed.title!"
                    >
                      <NuxtLink
                        :to="{
                          name: 'dashboard-feeds-id',
                          params: { id: feed.id! },
                        }"
                      >
                        <!--              <component :is="feed.icon" />-->
                        <span>{{ feed.title }}</span>
                      </NuxtLink>
                    </SidebarMenuButton>
                  </template>
                </CollapsibleContent>
              </Collapsible>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
