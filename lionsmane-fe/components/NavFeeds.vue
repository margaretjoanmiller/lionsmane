<script setup lang="ts">

import {
  SidebarGroup,
  SidebarGroupLabel, SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub,
  SidebarMenuSubButton, SidebarMenuSubItem
} from "~/components/ui/sidebar";
import {useFeedStore} from '@/stores/feedStore'

const feedStore = useFeedStore()

const feeds = feedStore.feeds
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>Feeds</SidebarGroupLabel>
    <SidebarMenu>
        <SidebarMenuItem v-for="feed in feeds" :key="feed.id!">
          <SidebarMenuButton as-child :tooltip="feed.title!">
            <NuxtLink :to="{name: 'dashboard-feeds-id', params: {id: feed.id!} }">
              <!--              <component :is="feed.icon" />-->
              <span>{{ feed.title }}</span>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
