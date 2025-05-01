/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from "pinia";
import type { SchemaArticleOut } from "@/utils/gen/schema";

export const useArticleStore = defineStore("articleStore", () => {
  const { user } = useOidcAuth();

  const articles = ref([] as SchemaArticleOut[]);

  async function fetchArticles() {
    articles.value = await $lion("/articles", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  }

  return {
    articles,
    fetchArticles,
  };
});
