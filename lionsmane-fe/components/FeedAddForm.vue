<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { postFeedsBody } from '@/utils/gen/feed-resource';
import type { SchemaFeedIn } from '@/utils/gen/schema';

const toast = useToast();

const { loggedIn, user, login } = useOidcAuth();

if (!loggedIn.value) {
  await login();
}

const queryClient = useQueryClient();

const feedState = reactive({
  title: '',
  description: '',
  url: '',
  folderId: null,
});

const {
  isPending: isPendingFolders,
  isError: isErrorFolders,
  data: folders,
  error: foldersError,
} = useQuery({
  queryKey: ['folders'],
  queryFn: async () => {
    const resp = await $lion('/folders', {
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

const { isPending, isError, error, isSuccess, mutate } = useMutation({
  mutationFn: async (newFeed: SchemaFeedIn) =>
    await $lion('/feeds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
      body: {
        ...newFeed,
      },
    }),
  onSuccess() {
    queryClient.invalidateQueries();
    toast.add({ title: 'Added feed successfully.', color: 'success' });
  },
  onError() {
    toast.add({ title: 'Error adding feed', color: 'error' });
  },
});
</script>

<template>
  <UForm
    :schema="postFeedsBody"
    :state="feedState"
    class="space-y-4"
    @submit="mutate(feedState)"
  >
    <UFormField label="title" name="title">
      <UInput v-model="feedState.title" />
    </UFormField>
    <UFormField label="description" name="description">
      <UInput v-model="feedState.description" />
    </UFormField>
    <UFormField label="url" name="url">
      <UInput v-model="feedState.url" />
    </UFormField>

    <FormField label="folderId" name="folderId">
      <USelect
        v-model="feedState.folderId!"
        label="Folders"
        value-key="id"
        :items="folders"
        class="w-48"
      />
    </FormField>
    <UButton type="submit"> Submit</UButton>
  </UForm>
</template>
