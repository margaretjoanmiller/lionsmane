<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: 'dash',
});

const route = useRoute();

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
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <template v-for="article in articles
      ?.map((a) => {
        if (a.read) {
          return null;
        }
        return {
          id: a.id || '',
          title: a.title || '',
          preview: `${a.textPreview?.substring(0, 70)}...`,
          date: a.publishedAt || '',
          isRead: a.read || false,
        };
      })
      .filter((i) => i !== null)" :key="article.id">
      <ArticleCard :article-preview="article" />
    </template>
  </div>
</template>
