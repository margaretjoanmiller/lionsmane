<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: "dash",
});

const articleStore = useArticleStore();
await articleStore.fetchArticles();

const articles = articleStore.articles.map((article) => {
  if (!article || !article.publishedAt || !article.title) {
    throw new Error("Malformed feed");
  }

  return {
    title: article.title,
    preview: article.textPreview?.substring(0, 70),
    date: new Date(article.publishedAt).toLocaleDateString(),
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
