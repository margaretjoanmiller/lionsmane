<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { CollapsibleTrigger, Collapsible } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-vue-next';
import { apiClient } from '@/utils/apiClient';

const {
  isPending: isPendingFeeds,
  isError: isErrorFeeds,
  data: feeds,
  error: feedsError,
} = useQuery({
  queryKey: ['feeds'],
  queryFn: async () => {
    return await apiClient.GET('/api/v1/feeds', {
      credentials: 'include',
    });
  },
});

const {
  isPending: isPendingFolders,
  isError: isErrorFolders,
  data: folders,
  error: foldersError,
} = useQuery({
  queryKey: ['folders'],
  queryFn: async () => {
    return await $lion('/folders');
  },
});
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>RSS</SidebarGroupLabel>
    <SidebarMenu>
      <!--Loading -->
      <SidebarMenuItem v-if="isPendingFeeds || isPendingFolders">
        Loading...
      </SidebarMenuItem>
      <SidebarMenuItem
        v-else-if="isErrorFeeds || isErrorFolders"
        class="accent-error"
      >
        Error!
      </SidebarMenuItem>
      <!-- Main Feeds Collapsible -->
      <Collapsible
        v-else-if="feeds && folders"
        class="group/feeds-collapsible"
        default-open
      >
        <SidebarMenuItem>
          <SidebarMenuButton>
            <NuxtLink :to="{ name: 'dashboard-home' }">Feeds</NuxtLink>
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
                v-for="feed in feeds.filter((f) => !f.folderId)"
                :key="feed.id!"
                as-child
                :tooltip="feed.title!"
              >
                <NuxtLink
                  :to="{
                    name: 'dashboard-feeds-id',
                    params: { id: feed.id },
                  }"
                >
                  <span>{{ feed.title }}</span> {{ feed.numberUnread }}
                </NuxtLink>
              </SidebarMenuButton>

              <template v-for="folder in folders" :key="folder.id!">
                <Collapsible class="group/folder-collapsible">
                  <SidebarMenuSubItem>
                    <SidebarMenuButton as-child :tooltip="folder.name || ''">
                      <span>{{ folder.name ?? 'error' }}</span>
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
                              params: { id: feed.id },
                            }"
                          >
                            <span>{{ feed.title }}</span>
                            {{ feed.numberUnread }}
                          </NuxtLink>
                        </SidebarMenuButton>
                        <Separator />
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuSubItem>
                </Collapsible>
              </template>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      <SidebarMenuItem>
        <SidebarMenuButton as-child>
          <NuxtLink to="/dashboard/settings/newfolder">
            <Icon name="material-symbols:add" />
            Add folder
          </NuxtLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
