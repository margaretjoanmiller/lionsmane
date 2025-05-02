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
import { sleep } from "@/utils/utilFunctions";

const { loggedIn, login, user } = useOidcAuth();

if (!loggedIn.value || !user.value) {
  await login();
}

const feedStore = useFeedStore();
const articleStore = useArticleStore();
const folderStore = useFolderStore();
const route = useRoute();

onMounted(async () => {
  await feedStore.fetchFeeds();
  await folderStore.fetchFolders();
});

async function onReload() {
  try {
    await $lion("/feeds/refresh/all", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
    $toast.success("Feeds are fetching new articles, please wait...");
    await sleep(5000);
    await feedStore.fetchFeeds();
    await articleStore.fetchArticles();
    await folderStore.fetchFolders();
  } catch (e) {
    console.error(e);
    $toast.error("Failed to request feed refresh");
  }
}

const { $toast } = useNuxtApp();
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
          <Button variant="outline" class="absolute right-5" @click="onReload">
            <Icon name="material-symbols:cloud-sync-outline" />
            Fetch articles
          </Button>
          <div class="fixed right-6 bottom-6 group">
            <Dialog>
              <DialogTrigger>
                <Button
                  class="flex justify-center items-center w-14 h-14 rounded-full 0 focus:ring-4"
                >
                  <Icon name="material-symbols:add" size="72" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <FeedAddForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <slot />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
