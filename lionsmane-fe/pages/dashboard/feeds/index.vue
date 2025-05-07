<script setup lang="ts">
definePageMeta({
  layout: 'dash',
  name: 'dashboard-feeds-all',
  alias: '/dashboard/feeds/all',
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
