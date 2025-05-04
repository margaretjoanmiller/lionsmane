/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { ref } from 'vue';
import { defineMutation, useMutation } from '@pinia/colada';
import type { SchemaFolderIn } from '@/utils/gen/schema';

export const useCreateFolder = defineMutation(() => {
  const { user } = useOidcAuth();
  const newFolder = ref<SchemaFolderIn>({
    name: '',
    description: '',
    feeds: [],
  });
  const { mutate, ...mutation } = useMutation({
    mutation: (folder: SchemaFolderIn) =>
      $lion('/folders', {
        method: 'POST',
        body: folder,
        headers: {
          Authorization: `Bearer ${user?.value?.accessToken}`,
        },
      }),
  });

  return {
    ...mutation,
    // we can still pass the todoText to the mutation so it appears in plugins
    // and other places
    createFolder: () => mutate(newFolder.value),
    // expose the todoText ref
    newFolder,
  };
});
