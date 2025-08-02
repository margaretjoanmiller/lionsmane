<script setup lang="ts">
definePageMeta({
  layout: 'dash',
  name: 'dashboard-feeds-all',
  alias: '/dashboard/feeds/all',
});

const {
  isPending: isPendingArticles,
  isError: isErrorArticles,
  data: articles,
  error: articlesError,
} = useQuery({
  queryKey: ['articles'],
  queryFn: async () => {
    const resp = await $lion('/articles');
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});
</script>

<template>
  <div>
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <template v-for="article in articles?.map((a) => {
        return {
          id: a.id || '',
          title: a.title || '',
          preview: `${a.textPreview?.substring(0, 70)}...`,
          date: a.publishedAt || '',
          isRead: a.read || false,
        };
      })" :key="a.id">
        <ArticleCard :article-preview="article" />
      </template>
    </div>
  </div>
</template>
