<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { postFoldersBody } from '@/utils/gen/folder-resource';
import type { SchemaFolderIn } from '@/utils/gen/schema';

const toast = useToast();
const { user } = useOidcAuth();

const queryClient = useQueryClient();

const {
  isPending: isPendingFeeds,
  isError: isErrorFeeds,
  data: feeds,
  error: feedsError,
} = useQuery({
  queryKey: ['feeds'],
  queryFn: async () => {
    const resp = await $lion('/feeds', {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});

const newFolder = reactive({
  name: '',
  description: '',
  feeds: [],
});

const { isPending, isError, error, isSuccess, mutate } = useMutation({
  mutationFn: async (newFolder: SchemaFolderIn) =>
    await $lion('/folders', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
      body: {
        ...newFolder,
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
</script>

<template>
  <UForm
    :schema="postFoldersBody"
    :state="newFolder"
    class="space-y-4"
    @submit="mutate(newFolder)"
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
        :items="
          feeds?.map((feed) => ({
            label: feed.title,
            value: feed.id,
          }))
        "
        class="w-48"
      />
    </UFormField>

    <UButton type="submit" :disabled="isPending"> Submit</UButton>
  </UForm>
</template>
