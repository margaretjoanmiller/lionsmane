/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from 'pinia';
import type { SchemaFeedDto } from '@/utils/gen/schema';
import { useFeedQuery } from '@/queries/feeds';

export const useFeedStore = defineStore('feeds', () => {
  const feeds = ref([] as SchemaFeedDto[]);
  const isLoaded = ref(false);

  function hydrateFeeds() {
    const { feedList } = useFeedQuery();
    feeds.value = feedList.value.data ?? [];
    isLoaded.value = true;
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
    isLoaded,
    hydrateFeeds,
    getFeedsAsSelect,
  };
});
