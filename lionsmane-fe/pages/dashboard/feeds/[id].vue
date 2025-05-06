<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: 'dash',
});

const route = useRoute();
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <template v-for="article in articles" :key="article.id">
      <ArticleCard :article-preview="article" />
    </template>
  </div>
</template>
