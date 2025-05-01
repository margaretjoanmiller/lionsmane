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
import { sleep } from "@/utils/utilFunctions";
import { CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-vue-next";

const { user } = useOidcAuth();

const feedStore = useFeedStore();
const articleStore = useArticleStore();

const { feeds } = storeToRefs(feedStore);

const { $toast } = useNuxtApp();

async function onRequestRefresh() {
  try {
    await $lion("/feeds/refresh/all", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
    $toast.success("Feeds are fetching new articles, please wait...");
    await sleep(5000);
    await articleStore.fetchArticles();
  } catch (e) {
    console.error(e);
    $toast.error("Failed to request feed refresh");
  }
}
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
                v-for="feed in feeds"
                :key="feed.id!"
                as-child
                :tooltip="feed.title!"
              >
                <NuxtLink
                  :to="{ name: 'dashboard-feeds-id', params: { id: feed.id! } }"
                >
                  <!--              <component :is="feed.icon" />-->
                  <span>{{ feed.title }}</span>
                </NuxtLink>
              </SidebarMenuButton>
              <Separator />
              <SidebarMenuButton as-child>
                <NuxtLink to="/dashboard/feeds/add">
                  <span>Add feed</span>
                  <Icon name="mdi:plus-circle" />
                </NuxtLink>
              </SidebarMenuButton>
              <SidebarMenuButton as-child @click="onRequestRefresh">
                <span
                  >Request refresh
                  <Icon name="material-symbols:cloud-sync-outline"
                /></span>
              </SidebarMenuButton>
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
