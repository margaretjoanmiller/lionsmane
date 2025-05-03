/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

import { defineStore } from "pinia";
import type { SchemaArticleOut } from "@/utils/gen/schema";

export const useFolderStore = defineStore("folderStore", () => {
  const folders = ref([] as SchemaArticleOut[]);

  const { user } = useOidcAuth();

  async function fetchFolders() {
    folders.value = await $lion("/folders", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  }

  return {
    folders,
    fetchFolders,
  };
});
