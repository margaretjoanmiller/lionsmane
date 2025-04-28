<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: "dash",
});

const articleStore = useArticleStore();
await articleStore.fetchArticles();

const articles = articleStore.articles.map((art) => {
  if (!art.title || !art.publishedAt) {
    throw new Error("Article is malformed");
  }
  if (!art.content) {
    return {
      title: art.title,
      preview: "no preview available",
      date: new Date(art.publishedAt).toLocaleDateString(),
    };
  }
  return {
    title: art.title,
    preview:
      art.content!.length > 50
        ? `${art.content?.substring(0, 50)} ...`
        : art.content,
    date: new Date(art.publishedAt).toLocaleDateString(),
  };
});
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <template v-for="article in articles" :key="article.id">
      <ArticleCard :article-preview="article" />
    </template>
  </div>
</template>
