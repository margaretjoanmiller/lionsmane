<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->

<script setup lang="ts">
import { postFoldersBody } from "@/utils/gen/folder-resource";
import type { SchemaFolderIn } from "@/utils/gen/schema";
import type { FormSubmitEvent } from "@nuxt/ui";

const { user, loggedIn, login } = useOidcAuth();

const state = reactive({
  name: "",
  description: "",
  feeds: [] as string[],
});

const { $toast } = useNuxtApp();

const feedStore = useFeedStore();

await feedStore.fetchFeeds();

const feeds = computed(() => {
  feedStore.feeds.map((feed) => {
    return {
      label: feed.title as string,
      id: feed.id as string,
    };
  });
});

async function onSubmit(event: FormSubmitEvent<SchemaFolderIn>) {
  if (!user.value || !loggedIn.value) await login();
  const resp = await $lion("/folders", {
    method: "POST",
    body: {
      name: event.data.name,
      description: event.data.description,
      feeds: event.data.feeds,
    },
    headers: {
      Authorization: `Bearer ${user.value?.accessToken}`,
    },
  });

  if (resp) $toast.success("Folder Added");
  else $toast.error("Folder could not be added");
}
</script>

<template>
  <UForm
    :schema="postFoldersBody"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name">
      <UInput v-model="state.name" />
    </UFormField>

    <UFormField label="Description" name="description">
      <UInput v-model="state.description" />
    </UFormField>
    <UFormField name="feeds">
      <USelect
        v-model="state.feeds"
        multiple
        label="Feeds"
        value-key="id"
        :items="feeds"
        class="w-48"
      />
    </UFormField>

    <UButton type="submit"> Submit</UButton>
  </UForm>
</template>
