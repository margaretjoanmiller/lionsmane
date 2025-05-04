/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { ref } from 'vue';
import { defineMutation, useMutation } from '@pinia/colada';
import type { SchemaFeedIn } from '~/utils/gen/schema';

export const useCreateFeed = defineMutation(() => {
  const { user } = useOidcAuth();
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
  });

  return {
    ...mutation,
    // we can still pass the todoText to the mutation so it appears in plugins
    // and other places
    createFeed: () => mutate(newFeed.value),
    // expose the todoText ref
    newFeed,
  };
});
