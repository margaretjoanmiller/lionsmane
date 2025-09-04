<script setup lang="ts">
import { readStatus } from '@/stores/readStatus';

definePageMeta({
  layout: 'dash',
  name: 'dashboard-home',
});

const readStatusStore = useReadStatusStore();

const {
  isPending: isPendingArticles,
  isError: isErrorArticles,
  data: articles,
  error: articlesError,
} = useQuery({
  queryKey: ['articles-all'],
  queryFn: async () => {
    const resp = await apiClient.GET('/article', {
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

  let filtered = articles.value;

  switch (readStatusStore.readStatus) {
    case readStatus.UNREAD:
      filtered = articles.value.filter((a) => !a.read);
      break;
    case readStatus.READ:
      filtered = articles.value.filter((a) => a.read);
      break;
    case readStatus.STARRED:
      filtered = articles.value.filter((a) => a.starred); // TODO: Add starred state
      break;
    default:
      break;
  }

  return filtered.map((a) => ({
    id: a.id || '',
    title: a.title || '',
    preview: `${a.textPreview?.substring(0, 70)}...`,
    date: a.publishedAt || '',
    isRead: a.read || false,
    starred: a.starred || false,
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
