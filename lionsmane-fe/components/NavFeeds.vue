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
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-vue-next";

const feedStore = useFeedStore();
const folderStore = useFolderStore();

const { feeds } = storeToRefs(feedStore);
const { folders } = storeToRefs(folderStore);

const orphanFeeds = computed(() => {
  return feedStore.feeds.filter((feed) => !feed.folderId);
});
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>RSS</SidebarGroupLabel>
    <SidebarMenu>
      <!-- Main Feeds Collapsible -->
      <Collapsible class="group/feeds-collapsible">
        <SidebarMenuItem>
          <SidebarMenuButton>
            <NuxtLink :to="{ name: 'dashboard-feeds-all' }">Feeds</NuxtLink>
          </SidebarMenuButton>
          <CollapsibleTrigger as-child>
            <SidebarMenuAction>
              <ChevronRight
                class="ml-auto transition-transform duration-200 group-data-[state=open]/feeds-collapsible:rotate-90"
              />
            </SidebarMenuAction>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              <!-- Orphan Feeds (without folders) -->
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
                  <span>{{ feed.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>

              <template v-for="folder in folders" :key="folder.id!">
                <Collapsible class="group/folder-collapsible">
                  <SidebarMenuSubItem>
                    <SidebarMenuButton as-child :tooltip="folder.name">
                      <span>{{ folder.name ?? "error" }}</span>
                    </SidebarMenuButton>
                    <CollapsibleTrigger as-child>
                      <SidebarMenuAction>
                        <ChevronRight
                          class="ml-auto transition-transform duration-200 group-data-[state=open]/folder-collapsible:rotate-90"
                        />
                      </SidebarMenuAction>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuButton
                          v-for="feed in feeds.filter(
                            (f) => f.folderId === folder.id,
                          )"
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
                            <span>{{ feed.title }}</span>
                          </NuxtLink>
                        </SidebarMenuButton>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuSubItem>
                </Collapsible>
              </template>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
