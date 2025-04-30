/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
 */

import { defineStore } from "pinia";
import type { SchemaFeedDto } from "@/utils/gen/schema";

export const useFeedStore = defineStore("feeds", {
  state: () => ({
    feeds: [] as SchemaFeedDto[],
  }),
  actions: {
    storeFeeds(newFeedsDto: SchemaFeedDto[]) {
      this.feeds = newFeedsDto;
    },
  },
});
