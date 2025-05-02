<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import AppSidebar from "@/components/AppSidebar.vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { match } from "ts-pattern";
import { Primitive } from "reka-ui";

const { loggedIn, login, user } = useOidcAuth();

if (!loggedIn.value || !user.value) {
  await login();
}

const feedStore = useFeedStore();
const articlesStore = useArticleStore();
const route = useRoute();

onMounted(() => {
  feedStore.fetchFeeds();
});

async function onReload() {
  await feedStore.fetchFeeds();
  await articlesStore.fetchArticles();
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
          <Button
            variant="outline"
            size="icon"
            class="absolute right-4"
            @click="onReload"
          >
            <Icon name="material-symbols:refresh" />
          </Button>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
