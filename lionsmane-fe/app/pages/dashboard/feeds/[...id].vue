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
    const resp = await $lion('/articles/feed/{feedId}', {
      path: {
        feedId: id,
      },
    });
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});


const filteredArticles = computed(() => {
  if (!articles.value) return [];

  let filtered = articles.value;

  switch (readStatusStore.readStatus) {
    case readStatus.UNREAD:
      filtered = articles.value.filter(a => !a.read)
      break;
    case readStatus.READ:
      filtered = articles.value.filter(a => a.read)
      break;
    case readStatus.STARRED:
      filtered = articles.value.filter(a => a.read) // TODO: Add starred state
      break;
    default:
      break;
  }

  return filtered.map(a => ({

    id: a.id || '',
    title: a.title || '',
    preview: `${a.textPreview?.substring(0, 70)}...`,
    date: a.publishedAt || '',
    isRead: a.read || false,
  }))
})
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <template v-for="article in filteredArticles" :key="article.id">
      <ArticleCard :article-preview="article" />
    </template>
  </div>
</template>
