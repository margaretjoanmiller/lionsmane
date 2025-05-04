<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { useCreateFeed } from '@/mutations/feeds';
import { postFeedsBody } from '~/utils/gen/feed-resource';
import { useFeedQuery } from '~/queries/feeds';

const toast = useToast();

const { loggedIn, login } = useOidcAuth();

if (!loggedIn.value) {
  await login();
}

const { createFeed, status, asyncStatus, newFeed } = useCreateFeed();

const { refresh } = useFeedQuery();
const folderStore = useFolderStore();
const folders = computed(() => folderStore.getFoldersAsSelect());

async function onSubmit() {
  try {
    createFeed();
    await refresh();
    toast.add({ title: 'Feed added successfully', color: 'success' });
  } catch {
    toast.add({ title: 'Feed added failed', color: 'error' });
  }
}
</script>

<template>
  <UForm
    :schema="postFeedsBody"
    :state="newFeed"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="title" name="title">
      <UInput v-model="newFeed.title" />
    </UFormField>
    <UFormField label="description" name="description">
      <UInput v-model="newFeed.description" />
    </UFormField>
    <UFormField label="url" name="url">
      <UInput v-model="newFeed.url" />
    </UFormField>

    <FormField label="folderId" name="folderId">
      <USelect
        v-model="newFeed.folderId!"
        label="Folders"
        value-key="id"
        :items="folders"
        class="w-48"
      />
    </FormField>
    <UButton type="submit"> Submit</UButton>
  </UForm>
</template>
