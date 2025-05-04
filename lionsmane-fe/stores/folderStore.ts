/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

import { defineStore } from 'pinia';
import type { SchemaFolderOut } from '@/utils/gen/schema';

export const useFolderStore = defineStore('folderStore', () => {
  const folders = ref([] as SchemaFolderOut[]);

  function storeFolders(f: SchemaFolderOut[]) {
    folders.value = f;
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
    getFoldersAsSelect,
    storeFolders,
  };
});
