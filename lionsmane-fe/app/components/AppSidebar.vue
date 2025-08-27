<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import NavMain from '@/components/NavMain.vue';

import NavUser from '@/components/NavUser.vue';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  type SidebarProps,
} from '@/components/ui/sidebar';
import { Filter, Settings2 } from 'lucide-vue-next';
import { authClient } from '~/lib/auth-client';

const props = withDefaults(defineProps<SidebarProps>(), {
  variant: 'inset',
});

const session = authClient.useSession();

const data = {
  user: {
    name: session.value?.data?.user.name || 'error',
    email: session.value?.data?.user.email || '<no email>',
    avatar: '/img/Doc_Brown.jpg',
  },

  navMain: [
    {
      title: 'Rules',
      url: '#',
      icon: Filter,
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: Settings2,
    },
  ],
};
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink href="/dashboard">
              <div
                class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
              >
                <Icon name="mdi:mushroom-outline" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">lionsmane</span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavFeeds />
      <NavMain :items="data.navMain" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :user="data.user" />
    </SidebarFooter>
  </Sidebar>
</template>
