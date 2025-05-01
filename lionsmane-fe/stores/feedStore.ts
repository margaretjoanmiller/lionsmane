/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from "pinia";
import type { SchemaFeedDto } from "@/utils/gen/schema";

export const useFeedStore = defineStore("feeds", () => {
  const { user } = useOidcAuth();

  const feeds = ref([] as SchemaFeedDto[]);

  async function fetchFeeds() {
    feeds.value = await $lion("/feeds", {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  }

  return {
    feeds,
    fetchFeeds,
  };
});
