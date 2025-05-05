<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->

<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import * as z from 'zod';
import type { TableColumn } from '@nuxt/ui';
import type { Row } from '@tanstack/vue-table';
import type { SchemaFeedDto, SchemaFolderOut } from '@/utils/gen/schema';
import { postFeedsUpdateIdBody } from '@/utils/gen/feed-resource';
import { useEditFeed, useDeleteFeed } from '@/mutations/feeds';
import { useFeedQuery } from '@/queries/feeds';
import { useFolderQuery } from '@/queries/folders';

definePageMeta({
  layout: 'dash',
});

const UButton = resolveComponent('UButton');
const UBadge = resolveComponent('UBadge');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const toast = useToast();

const { user } = useOidcAuth();

const feedStore = useFeedStore();
const folderStore = useFolderStore();

const { editFeed, feedToEdit, status: editStatus, asyncStatus } = useEditFeed();
const { deleteFeed, feedId, status: deleteStatus } = useDeleteFeed();
const { refresh: feedRefresh } = useFeedQuery();
const { refresh: folderRefresh } = useFolderQuery();

const folders = computed(() => folderStore.getFoldersAsSelect());

const data = computed(() => feedStore.feeds);

const columns: TableColumn<SchemaFeedDto>[] = [
  {
    accessorKey: 'id',
    header: '#',
  },
  {
    accessorKey: 'title',
    header: 'title',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'url',
    header: 'URL',
  },
  {
    accessorKey: 'lastUpdated',
    header: 'Date',
    cell: ({ row }) => {
      return new Date(row.getValue('lastUpdated')).toLocaleString('en-US', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    },
  },
  {
    accessorKey: 'feedId',
    header: 'Feed',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-right' },
        h(
          UDropdownMenu,
          {
            content: {
              align: 'end',
            },
            items: getRowItems(row),
            'aria-label': 'Actions dropdown',
          },
          () =>
            h(UButton, {
              icon: 'i-lucide-ellipsis-vertical',
              color: 'neutral',
              variant: 'ghost',
              class: 'ml-auto',
              'aria-label': 'Actions dropdown',
            }),
        ),
      );
    },
  },
];

function getRowItems(row: Row<SchemaFeedDto>) {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'Edit',
      onSelect() {
        feedToEdit.value = row.original;
        isModalOpen.value = true;
      },
    },
    {
      label: 'Delete',
      onSelect() {
        feedId.value = row.getValue('id');
        deleteFeed();
      },
    },
  ];
}

async function onSubmit() {
  editFeed();
  await feedRefresh();
  await folderRefresh();
  if (editStatus.value === 'error') {
    toast.add({
      title: 'Error updating feed',
      color: 'error',
    });
  }
  if (editStatus.value === 'success') {
    isModalOpen.value = false;
    toast.add({ title: 'Feed updated successfully', color: 'success' });
  }
}

type UpdateSchema = z.output<typeof postFeedsUpdateIdBody>;

const isModalOpen = ref(false);
</script>

<template>
  <div class="flex justify-center">
    <UTable :data="data" :columns="columns" class="flex-1" />
    <UModal v-model:open="isModalOpen">
      <UButton hidden="hidden">Open</UButton>
      <template #content>
        <UForm
          :schema="postFeedsUpdateIdBody"
          :state="feedToEdit"
          @submit="onSubmit"
        >
          <UFormField label="title" name="title">
            <UInput v-model="feedToEdit.title" />
          </UFormField>

          <UFormField label="description" name="description">
            <UInput v-model="feedToEdit.description" />
          </UFormField>

          <UFormField label="url" name="url">
            <UInput v-model="feedToEdit.url" type="url" />
          </UFormField>

          <FormField label="folderId" name="folderId">
            <USelect
              v-model="feedToEdit.folderId!"
              label="Folders"
              value-key="id"
              :items="folders"
              class="w-48"
            />
          </FormField>

          <UButton type="submit" :disabled="asyncStatus === 'loading'">
            Submit
          </UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
