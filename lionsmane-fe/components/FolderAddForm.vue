<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { postFoldersBody } from '@/utils/gen/folder-resource';
import { useCreateFolder } from '@/mutations/folders';
import { useFolderQuery } from '@/queries/folders';
import { useFeedQuery } from '@/queries/feeds';

const toast = useToast();

const {
  folderList,
  status: folderStatus,
  refresh: folderRefresh,
} = useFolderQuery();
const { feedList, status: feedStatus, refresh: feedRefresh } = useFeedQuery();

const feeds = computed(() => feedStore.getFeedsAsSelect());
const { createFolder, newFolder, status, asyncStatus } = useCreateFolder();

async function onSubmit() {
  createFolder();
  await folderRefresh();
  await feedRefresh();
  if (status.value === 'success') {
    toast.add({ title: 'Added folder successfully.', color: 'success' });
  } else if (status.value === 'error') {
    toast.add({ title: 'Error adding feed', color: 'error' });
  }
}
</script>

<template>
  <UForm
    :schema="postFoldersBody"
    :state="newFolder"
    class="space-y-4"
    @submit="onSubmit"
  >
    <UFormField label="Name" name="name">
      <UInput v-model="newFolder.name" />
    </UFormField>

    <UFormField label="Description" name="description">
      <UInput v-model="newFolder.description" />
    </UFormField>
    <UFormField name="feeds">
      <USelect
        v-model="newFolder.feeds!"
        multiple
        label="Feeds"
        value-key="id"
        :items="feeds"
        class="w-48"
      />
    </UFormField>

    <UButton type="submit" :disabled="asyncStatus === 'loading'">
      Submit
    </UButton>
  </UForm>
</template>
