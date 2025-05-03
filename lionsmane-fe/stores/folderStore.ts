/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

import { defineStore } from "pinia";
import type { SchemaFolderOut } from "@/utils/gen/schema";

export const useFolderStore = defineStore("folderStore", () => {
  const folders = ref([] as SchemaFolderOut[]);

  const { user } = useOidcAuth();

  async function fetchFolders() {
    folders.value = await $lion("/folders", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
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
    fetchFolders,
    getFoldersAsSelect,
  };
});
