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
import { CollapsibleTrigger } from "~/components/ui/collapsible";
import { ChevronRight } from "lucide-vue-next";

const feedStore = useFeedStore();

const feeds = feedStore.feeds;
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>RSS</SidebarGroupLabel>
    <SidebarMenu>
      <Collapsible class="group/collapsible">
        <SidebarMenuItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuButton>
              <span>Feeds</span>
              <ChevronRight
                class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
              />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent v-for="feed in feeds" :key="feed.id!">
            <SidebarMenuSub>
              <SidebarMenuButton as-child :tooltip="feed.title!">
                <NuxtLink
                  :to="{ name: 'dashboard-feeds-id', params: { id: feed.id! } }"
                >
                  <!--              <component :is="feed.icon" />-->
                  <span>{{ feed.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
      <SidebarMenuItem>
        <SidebarMenuButton as-child>
          <NuxtLink to="/dashboard/feeds/add">
            <span>Add feed</span>
            <Icon name="mdi:plus-circle" />
          </NuxtLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroup>
</template>
