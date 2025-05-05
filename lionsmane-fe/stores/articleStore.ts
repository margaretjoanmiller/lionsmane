/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from 'pinia';
import type { SchemaArticleOut } from '@/utils/gen/schema';
import { useArticleQuery } from '../queries/articles';

export const useArticleStore = defineStore('articleStore', () => {
  const articles = ref([] as SchemaArticleOut[]);

  const isLoaded = ref(false);

  function hydrateArticles() {
    const { articleList } = useArticleQuery();
    articles.value = articleList.value.data ?? [];
    isLoaded.value = true;
  }

  return {
    articles,
    isLoaded,
    hydrateArticles,
  };
});
