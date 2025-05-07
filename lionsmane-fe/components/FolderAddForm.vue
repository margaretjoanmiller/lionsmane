<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import type { SchemaFolderIn } from '@/utils/gen/schema';
import type { FormError, FormErrorEvent, FormSubmitEvent } from '@nuxt/ui';
import { z as zod } from 'zod';

const toast = useToast();

const { session } = useUserSession();

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

const newFolder = ref({
  name: '',
  description: '',
  feeds: [
    {
      label: '',
      value: '',
    },
  ],
});

const { isPending, isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (newFolder: SchemaFolderIn) =>
    $lion('/folders', {
      method: 'POST',
      body: {
        ...newFolder,
      },
    }),
  async onSuccess() {
    await queryClient.invalidateQueries();
    toast.add({ title: 'Added folder successfully.', color: 'success' });
  },
  onError() {
    toast.add({ title: 'Error adding folder', color: 'error' });
  },
});

function onSubmit() {
  mutate({
    name: newFolder.value.name,
    description: newFolder.value.description,
    feeds: newFolder.value.feeds.map((f) => f.value).filter((f) => f !== ''),
  });
}

async function onError(event: FormErrorEvent) {
  toast.add({
    title: 'Invalid form',
    color: 'error',
  });
}

const postFoldersBodySelect = zod.object({
  name: zod.string(),
  description: zod.string().nullish(),
  feeds: zod
    .array(
      zod.object({
        label: zod.string(),
        value: zod.string(),
      }),
    )
    .nullish(),
});
</script>

<template>
  <template v-if="isPendingFeeds">Loading..</template>
  <UForm
    v-else-if="feeds"
    :schema="postFoldersBodySelect"
    :state="newFolder"
    class="space-y-4"
    @submit="onSubmit"
    @error="onError"
  >
    <UFormField label="Name" name="name">
      <UInput v-model="newFolder.name" />
    </UFormField>

    <UFormField label="Description" name="description">
      <UInput v-model="newFolder.description" />
    </UFormField>
    <UFormField>
      <USelectMenu
        v-model="newFolder.feeds"
        multiple
        label="Feeds"
        :items="
          feeds.map((feed) => ({
            label: feed.title,
            value: feed.id,
          }))
        "
        class="w-49"
      />
    </UFormField>

    <UButton type="submit"> Submit</UButton>
  </UForm>
</template>
