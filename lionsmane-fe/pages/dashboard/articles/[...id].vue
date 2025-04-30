<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->
<script setup lang="ts">
import type { SchemaArticleOut } from "~/utils/gen/schema";

definePageMeta({
  layout: "dash",
});

const route = useRoute();

const { user } = useOidcAuth();

const articleStore = useArticleStore();

let article;

const cachedArticle = articleStore.articles.find(
  (art) => art.id === route.params.id,
);
if (!cachedArticle) {
  const { data, error } = await useLionData(`/articles/${route.params.id}`, {
    headers: {
      Authorization: `Bearer ${user.value?.accessToken}`,
    },
  });
  if (!data.value || error.value) {
    throw createError({
      statusCode: 404,
      statusMessage: "Could not find feed",
    });
  }

  article = data.value as SchemaArticleOut;
} else {
  article = cachedArticle;
}

const content = article.content ?? article.textPreview;
</script>

<template>
  <div
    class="text-justify bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
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
      <div class="prose prose-pink prose-lg prose-card" v-html="content"></div>

      <a :href="article.url!!">Original article</a>
    </div>
  </div>
</template>

<style scoped lang="postcss">
p {
  @apply leading-7 [&:not(:first-child)]:mt-6;
}

h4 {
  @apply text-muted-foreground text-sm;
}
</style>
