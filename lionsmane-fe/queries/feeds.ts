/*
 * Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
 */

import { defineQuery, useQuery } from '@pinia/colada';

export const useFeedQuery = defineQuery(() => {
  const { user } = useOidcAuth();
  const { state, ...rest } = useQuery({
    key: ['feeds'],
    query: () =>
      $lion('/feeds', {
        headers: {
          Authorization: `Bearer ${user.value?.accessToken}`,
        },
      }),
  });
  return {
    ...rest,
    feedList: state,
  };
});
