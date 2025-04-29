/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from "pinia";
import type { SchemaArticleOut, SchemaFeedDto } from "@/utils/gen/schema";

export const useArticleStore = defineStore("articleStore", () => {
  const { user, loggedIn, login } = useOidcAuth();

  const articles = ref([] as SchemaArticleOut[]);

  async function fetchArticles() {
    if (loggedIn.value && user.value) {
      try {
        const arts = await $lion("/articles", {
          headers: {
            Authorization: `Bearer ${user.value?.accessToken}`,
          },
        });
        if (!articles) {
          return;
        }
        articles.value = arts as SchemaFeedDto[];
      } catch (e) {
        console.error(e);
      }
    }
  }

  return {
    articles,
    fetchArticles,
  };
});
