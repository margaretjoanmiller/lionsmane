/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { ref } from 'vue';
import { defineMutation, useMutation, useQueryCache } from '@pinia/colada';
import type { SchemaFeedIn, SchemaFeedDto } from '@/utils/gen/schema';

export const useCreateFeed = defineMutation(() => {
  const { user } = useOidcAuth();

  const queryCache = useQueryCache();
  const newFeed = ref<SchemaFeedIn>({
    title: '',
    url: '',
  });
  const { mutate, ...mutation } = useMutation({
    mutation: (feed: SchemaFeedIn) =>
      $lion('/feeds', {
        method: 'POST',
        body: feed,
        headers: {
          Authorization: `Bearer ${user?.value?.accessToken}`,
        },
      }),
    onSettled: async () =>
      await queryCache.invalidateQueries({
        key: ['feeds', 'folders'],
        active: null,
      }),
  });

  return {
    ...mutation,
    createFeed: () => mutate(newFeed.value),
    newFeed,
  };
});

export const useDeleteFeed = defineMutation(() => {
  const { user } = useOidcAuth();

  const feedId = ref<string>('');
  const queryCache = useQueryCache();
  const { mutate, ...mutation } = useMutation({
    mutation: (id: string) => {
      return $lion(`/feeds/delete/{id}`, {
        path: {
          id,
        },
        headers: {
          Authorization: `Bearer ${user.value?.accessToken}`,
        },
      });
    },
  });
  return {
    ...mutation,
    deleteFeed: () => mutate(feedId.value),
    feedId,
  };
});

export const useEditFeed = defineMutation(() => {
  const { user } = useOidcAuth();

  const feedToEdit = ref<SchemaFeedDto>({
    id: '',
    title: '',
    description: '',
    url: '',
    folderId: '',
  });

  const queryCache = useQueryCache();
  const { mutate, ...mutation } = useMutation({
    mutation: (feed: SchemaFeedDto) => {
      return $lion(`/feeds/update/{id}`, {
        method: 'POST',
        path: {
          id: feed.id!,
        },
        body: {
          ...feed,
        },
        headers: {
          Authorization: `Bearer ${user.value?.accessToken}`,
        },
      });
    },
  });
  return {
    ...mutation,
    editFeed: () => mutate(feedToEdit.value),
    feedToEdit,
  };
});
