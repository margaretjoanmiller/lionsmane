<script setup lang="ts">
definePageMeta({
  layout: "dash",
  name: "dashboard-feeds-all",
  alias: "/dashboard/feeds/all",
});

const articleStore = useArticleStore();

onMounted(() => {
  articleStore.fetchArticles();
});

const articles = computed(() => {
  return articleStore.articles.map((article) => {
    {
      if (
        !article.title ||
        !article.textPreview ||
        !article.publishedAt ||
        !article.id
      ) {
        throw createError({
          status: 500,
          statusText: "Malformed articles, something went very wrong",
        });
      }
      return {
        id: article.id,
        title: article.title,
        preview: `${article.textPreview.substring(0, 100)}...`,
        date: article.publishedAt,
      };
    }
  });
});
</script>

<template>
  <div>
    <div class="grid auto-rows-min gap-4 md:grid-cols-3">
      <template v-for="article in articles" :key="article.id">
        <ArticleCard :article-preview="article" />
      </template>
    </div>
  </div>
</template>
