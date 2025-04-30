/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from "pinia";
import type { SchemaArticleOut } from "@/utils/gen/schema";

export const useArticleStore = defineStore("articleStore", () => {
  const articles = ref([] as SchemaArticleOut[]);

  function storeArticles(arts: SchemaArticleOut[]) {
    articles.value = arts;
  }

  return {
    articles,
    storeArticles,
  };
});
