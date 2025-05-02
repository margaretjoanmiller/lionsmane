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
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    </SidebarMenu>
  </SidebarGroup>
</template>
