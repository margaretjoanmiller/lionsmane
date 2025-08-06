<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import z from 'zod'
import { postFeedsBody } from '@/utils/zod';

const toast = useToast();


const queryClient = useQueryClient();

const feedState = ref({
  title: '',
  description: '',
  url: '',
  folder: {
    label: '',
    value: '',
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
      throw new Error('Failed to fetch folders');
    }
    return resp;
  },
});

const { isPending, isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (newFeed: z.infer<typeof postFeedsBody>) =>
    $lion('/feeds', {
      method: 'POST',
      body: {
        ...newFeed,
      },
    }),
  async onSuccess() {
    await queryClient.invalidateQueries();
    toast.add({ title: 'Added feed successfully.', color: 'success' });
  },
  onError() {
    toast.add({ title: 'Error adding feed', color: 'error' });
  },
});

function onSubmit() {
  mutate({
    title: feedState.value.title,
    description: feedState.value.description,
    url: feedState.value.url,
    folderId: feedState.value.folder.value,
  });
}
</script>

<template>
  <UForm :schema="postFeedsBody" :state="feedState" class="space-y-4" @submit="onSubmit">
    <UFormField label="title" name="title">
      <UInput v-model="feedState.title" />
    </UFormField>
    <UFormField label="description" name="description">
      <UInput v-model="feedState.description" />
    </UFormField>
    <UFormField label="url" name="url">
      <UInput v-model="feedState.url" />
    </UFormField>

    <UFormField label="folderId" name="folderId">
      <USelectMenu v-model="feedState.folder" label="Folders" :items="folders?.map((folder) => ({
        label: folder.name || '',
        value: folder.id,
      }))
        " class="w-48" />
    </UFormField>
    <UButton type="submit"> Submit</UButton>
  </UForm>
</template>
