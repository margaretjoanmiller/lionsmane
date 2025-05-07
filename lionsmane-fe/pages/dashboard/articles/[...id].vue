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

let id: string;
if (Array.isArray(route.params.id)) {
  id = route.params.id[0];
} else {
  id = route.params.id;
}

const article = await $lion('/articles/{id}', {
  path: {
    id,
  },
});
if (!article) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Could not find article',
  });
}

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
