<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
import { readStatus } from '@/stores/readStatus';

definePageMeta({
  layout: 'dash',
});

const route = useRoute();
const readStatusStore = useReadStatusStore();

let id: string;
if (Array.isArray(route.params.id)) {
  id = route.params.id[0];
} else {
  id = route.params.id;
}

const {
  isPending: isPendingArticles,
  isError: isErrorArticles,
  data: articles,
  error: articlesError,
} = useQuery({
  queryKey: ['articles', { feedId: id }],
  queryFn: async () => {
    const resp = await apiClient.GET('/article/feed/{id}', {
      params: {
        path: { id },
      },
      credentials: 'include',
    });
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});

const filteredArticles = computed(() => {
  if (!articles.value) return [];

  let filtered = articles.value.data?.articles || [];

  switch (readStatusStore.readStatus) {
    case readStatus.UNREAD:
      filtered = articles.value.data?.articles.filter((a) => !a.isRead) || [];
      break;
    case readStatus.READ:
      filtered = articles.value.data?.articles.filter((a) => a.isRead) || [];
      break;
    case readStatus.STARRED:
      filtered = articles.value.data?.articles.filter((a) => a.isStarred) || [];
      break;
    default:
      break;
  }

  return filtered.map((a) => ({
    id: a.id || '',
    title: a.title || '',
    preview: `${a.readableText?.substring(0, 70)}...`,
    date: a.published || '',
    isRead: a.isRead || false,
    starred: a.isStarred || false,
  }));
});
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <template v-for="article in filteredArticles" :key="article.id">
      <ArticleCard :article-preview="article" />
    </template>
  </div>
</template>
