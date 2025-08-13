<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { h, resolveComponent } from 'vue';
import * as z from 'zod';
import { getFeedsBody } from '@/utils/zod';
import type { TableColumn } from '@nuxt/ui';
import type { Row } from '@tanstack/vue-table';
import { postFeedsUpdateIdBody } from '@/utils/zod';

definePageMeta({
  layout: 'dash',
});

const UButton = resolveComponent('UButton');
const UDropdownMenu = resolveComponent('UDropdownMenu');

const toast = useToast();

const queryClient = useQueryClient();

const {
  isPending: isPendingFeeds,
  isError: isErrorFeeds,
  data: feeds,
  error: feedsError,
} = useQuery({
  queryKey: ['feeds'],
  queryFn: async () => {
    const resp = await $lion('/feeds');
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});

const {
  isPending: isPendingFolders,
  isError: isErrorFolders,
  data: folders,
  error: foldersError,
} = useQuery({
  queryKey: ['folders'],
  queryFn: async () => {
    const resp = await $lion('/folders');
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});

type State = {
  id: string;
  title: string;
  description: string;
  url: string;
  folder: {
    label: string;
    value: string;
  };
  tags: string[];
};

const state = ref<State>({
  id: '',
  title: '',
  description: '',
  url: '',
  folder: {
    label: '',
    value: '',
  },
  tags: [] as string[],
});

const currentFeed = ref<z.infer<typeof getFeedsBody>>({
  id: '',
  title: '',
  description: '',
  url: '',
  folderId: '',
  tags: [],
});

// type Feed = {
//   id: string;
//   title: string;
//   description: string | undefined;
//   url: string;
//   folderId: string | undefined;
//   tags: string[];
// };

const columns: TableColumn<z.infer<typeof getFeedsBody>>[] = [
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
    accessorKey: 'folderId',
    header: 'Folder',
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

const {
  isPending: isPendingDelete,
  isError: isErrorDelete,
  error: errorDelete,
  isSuccess: isSuccessDelete,
  mutate: deleteFeed,
} = useMutation({
  mutationFn: (id: string) =>
    $lion('/feeds/delete/{id}', {
      path: {
        id,
      },
    }),
  async onSuccess() {
    await queryClient.invalidateQueries();
    toast.add({ title: 'Feed deleted successfully.', color: 'success' });
  },
  onError() {
    toast.add({ title: 'Error deleting feed', color: 'error' });
  },
});
const {
  isPending: isPendingEdit,
  isError: isErrorEdit,
  error: errorEdit,
  isSuccess: isSuccessEdit,
  mutate: editFeed,
} = useMutation({
  mutationFn: (feedToUpdate: z.infer<typeof getFeedsBody>) =>
    $lion('/feeds/update/{id}', {
      method: 'POST',
      path: {
        id: feedToUpdate.id!,
      },
      body: {
        title: feedToUpdate.title,
        description: feedToUpdate.description,
        url: feedToUpdate.url,
        folderId: feedToUpdate.folderId,
        tags: feedToUpdate.tags,
      },
    }),
  async onSuccess() {
    await queryClient.invalidateQueries();
    toast.add({ title: 'Feed edited successfully.', color: 'success' });
  },
  onError() {
    toast.add({
      title: 'Error editing feed',
      color: 'error',
    });
  },
});

function getRowItems(row: Row<z.infer<typeof getFeedsBody>>) {
  return [
    {
      type: 'label',
      label: 'Actions',
    },
    {
      label: 'Edit',
      onSelect() {
        currentFeed.value = row.original;
        state.value.id = currentFeed.value.id ?? '';
        state.value.title = currentFeed.value.title ?? '';
        state.value.description = currentFeed.value.description ?? '';
        state.value.url = currentFeed.value.url ?? '';
        state.value.folder.value = currentFeed.value.folderId || '';
        state.value.tags = currentFeed.value.tags;
        isModalOpen.value = true;
      },
    },
    {
      label: 'Delete',
      onSelect() {
        deleteFeed(row.getValue('id'));
      },
    },
  ];
}

function onSubmit() {
  editFeed({
    id: state.value.id,
    title: state.value.title,
    description: state.value.description,
    url: state.value.url,
    folderId: state.value.folder.value,
    tags: state.value.tags,
  });
  isModalOpen.value = false;
}

const isModalOpen = ref(false);
</script>

<template>
  <div v-if="folders && feeds" class="flex justify-center">
    <UTable :data="feeds" :columns="columns" class="flex-1" />
    <UModal v-model:open="isModalOpen">
      <UButton hidden="hidden">Open</UButton>
      <template #body>
        <UForm
          :schema="postFeedsUpdateIdBody"
          :state="state"
          @submit="onSubmit"
        >
          <UFormField label="title" name="title">
            <UInput v-model="state.title" />
          </UFormField>

          <UFormField label="description" name="description">
            <UInput v-model="state.description" />
          </UFormField>

          <UFormField label="url" name="url">
            <UInput v-model="state.url" type="url" />
          </UFormField>

          <UFormField label="folderId" name="folderId">
            <USelectMenu
              v-model="state.folder"
              label="Folders"
              :items="
                folders.map((folder) => ({
                  label: folder.name ?? '',
                  value: folder.id ?? '',
                }))
              "
              class="w-48"
            />
          </UFormField>

          <UFormField label="tags" name="tags">
            <UInputTags v-model="state.tags" />
          </UFormField>

          <UButton type="submit" :disabled="isPendingEdit"> Submit</UButton>
        </UForm>
      </template>
    </UModal>
  </div>
</template>
