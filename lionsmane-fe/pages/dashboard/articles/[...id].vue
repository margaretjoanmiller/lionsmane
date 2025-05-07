<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->
<script setup lang="ts">
import type { SchemaArticleOut } from '@/utils/gen/schema';

definePageMeta({
  layout: 'dash',
});

const route = useRoute();

const { session } = useUserSession();

const { data, error } = await $lion(`/articles/${route.params.id}`);
if (!data.value || error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Could not find feed',
  });
}

article = data.value as SchemaArticleOut;

const content = article.content ?? article.textPreview;
</script>

<template>
  <div
    class="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm"
  >
    <div class="m-6">
      <h1
        class="mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
      >
        {{ article.title }}
      </h1>
      <h4>
        {{ article.author }}
      </h4>
      <div class="prose prose-lg prose-card prose-pink" v-html="content"></div>

      <a :href="article.url!!">Original article</a>
    </div>
  </div>
</template>

<style scoped lang="postcss">
p {
  @apply leading-7 [&:not(:first-child)]:mt-6;
}

h4 {
  @apply text-sm text-muted-foreground;
}
</style>
