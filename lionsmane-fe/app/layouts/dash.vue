<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import AppSidebar from '@/components/AppSidebar.vue';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { sleep } from '@/utils/utilFunctions';
import ColorModeToggle from '@/components/ColorModeToggle.vue';
import type { DropdownMenuItem } from '@nuxt/ui';

const route = useRoute();
const toast = useToast();
const queryClient = useQueryClient();

const dropdownItems = ref<DropdownMenuItem[]>([
  {
    label: 'Unread',
    icon: 'i-fluent-mail-unread-16-filled',
  },
  {
    label: 'Read',
    icon: 'i-fluent-mail-read-16-filled',
  },
]);
async function onReload() {
  try {
    await $lion('/feeds/refresh/all');
    toast.add({ title: 'Feeds are fetching new articles, please wait...' });
    await sleep(5000);
    await queryClient.invalidateQueries();
  } catch (e) {
    console.error(e);
    toast.add({ title: 'Failed to request feed refresh' });
  }
}
</script>

<template>
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <header class="flex h-16 shrink-0 items-center gap-2">
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator
            orientation="vertical"
            class="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem class="hidden md:block">
                <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator class="hidden md:block" />
              <template v-if="route.name === 'dashboard-feeds-all'">
                <BreadcrumbItem>
                  <NuxtLink
                    to="/dashboard/feeds"
                    class="hover:text-foreground transition-colors"
                  >
                    Feeds
                  </NuxtLink>
                </BreadcrumbItem>
              </template>
              <template v-else-if="route.name === 'dashboard-feeds-id'">
                <BreadcrumbItem>
                  <NuxtLink
                    to="/dashboard/feeds"
                    class="hover:text-foreground transition-colors"
                  >
                    Feeds
                  </NuxtLink>
                </BreadcrumbItem>
              </template>
              <template v-else-if="route.name === 'dashboard-articles-id'">
                <BreadcrumbItem>
                  <NuxtLink
                    to="/dashboard/feeds"
                    class="hover:text-foreground transition-colors"
                  >
                    Feeds
                  </NuxtLink>
                </BreadcrumbItem>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
          <div class="absolute right-48">
            <UDropdownMenu :items="dropdownItems"
              ><UButton icon="i-material-symbols-news-outline" variant="outline"
                >Article status</UButton
              >
            </UDropdownMenu>
          </div>
          <div class="right-38 absolute">
            <ColorModeToggle />
          </div>
          <UButton variant="outline" class="absolute right-5" @click="onReload">
            <Icon name="material-symbols:cloud-sync-outline" />
            Fetch articles
          </UButton>
          <div class="group fixed bottom-6 right-6">
            <UModal>
              <Button
                class="0 flex h-14 w-14 items-center justify-center rounded-full focus:ring-4"
              >
                <Icon name="material-symbols:add" size="72" />
              </Button>
              <template #body>
                <FeedAddForm />
              </template>
            </UModal>
          </div>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
