/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

import { defineStore } from 'pinia';
import type { SchemaFolderOut } from '@/utils/gen/schema';
import { useFolderQuery } from '@/queries/folders';

export const useFolderStore = defineStore('folderStore', () => {
  const folders = ref([] as SchemaFolderOut[]);
  const isLoaded = ref(false);

  function hydrateFolders() {
    const { folderList } = useFolderQuery();
    folders.value = folderList.value.data ?? [];
    isLoaded.value = true;
  }

  function getFoldersAsSelect() {
    return folders.value.map((folder) => {
      return {
        label: folder.name as string,
        id: folder.id as string,
      };
    });
  }

  return {
    folders,
    isLoaded,
    getFoldersAsSelect,
    hydrateFolders,
  };
});
