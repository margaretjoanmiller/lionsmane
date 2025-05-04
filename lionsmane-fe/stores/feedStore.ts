/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from 'pinia';
import type { SchemaFeedDto } from '@/utils/gen/schema';

export const useFeedStore = defineStore('feeds', () => {
  const { user } = useOidcAuth();

  const feeds = ref([] as SchemaFeedDto[]);

  function storeFeeds(f: SchemaFeedDto[]) {
    feeds.value = f;
  }

  function getFeedsAsSelect() {
    return feeds.value.map((feed) => {
      return {
        label: feed.title as string,
        id: feed.id as string,
      };
    });
  }

  return {
    feeds,
    storeFeeds,
    getFeedsAsSelec,
  };
});
