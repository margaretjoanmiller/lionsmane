<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->
<script setup lang="ts">
definePageMeta({
  layout: 'dash',
});

const toast = useToast();
const route = useRoute();
const queryClient = useQueryClient();

let id: string;
if (Array.isArray(route.params.id)) {
  id = route.params.id[0];
} else {
  id = route.params.id;
}

const {
  isPending: isPendingArticles,
  isError: isErrorArticles,
  data: article,
  error: articlesError,
} = useQuery({
  queryKey: ['articles', { articleId: id }],
  queryFn: async () => {
    const resp = await $lion('/articles/{id}', {
      path: {
        id,
      },
    });
    if (!resp) {
      throw new Error('Failed to fetch feeds');
    }
    return resp;
  },
});

// we clean the HTML server-side
const content = computed(
  () => article.value?.content ?? article.value?.textPreview,
);

const { isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (artId: string) =>
    $lion('/articles/{id}', {
      method: 'PATCH',
      path: {
        id: artId,
      },
      body: {
        read: true,
      },
    }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['articles'] });
    await queryClient.invalidateQueries({ queryKey: ['feeds'] });
  },
  onError: () => {
    toast.add({ title: 'Error setting article as read', color: 'error' });
  },
  retry: 3,
});

type ArticleStarring = {
  id: string;
  starred: boolean;
};

const {
  isErrorStar,
  errorStar,
  isSuccessStar,
  mutate: starMutate,
} = useMutation({
  mutationFn: (art: ArticleStarring) =>
    $lion('/articles/{id}', {
      method: 'PATCH',
      path: {
        id: art.id,
      },
      body: {
        starred: art.starred,
      },
    }),
  onSuccess: async () => {
    await queryClient.invalidateQueries({
      queryKey: ['articles', { articleId: article.value?.id }],
    });
  },
  onError: () => {
    toast.add({ title: 'Error setting article as read', color: 'error' });
  },
  retry: 3,
});

function onStar() {
  starMutate({
    id: article.value?.id,
    starred: true,
  });
}
function onUnStar() {
  starMutate({
    id: article.value?.id,
    starred: false,
  });
}

watch(article, async (newArt) => {
  if (newArt !== null && newArt?.id !== undefined) mutate(newArt.id as string);
});
</script>

<template>
  <div>
    <UAlert
      v-if="isErrorArticles || isError"
      title="Error loading article"
      color="error"
      icon="i-lucide-server-off"
    />
    <div
      v-if="!isPendingArticles && article"
      class="bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm"
    >
      <div class="m-6">
        <h1
          class="mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl"
        >
          {{ article?.title }}

          <UButton
            v-if="article.starred === true"
            icon="i-fluent-star-12-filled"
            variant="ghost"
            @click="onUnStar"
          />
          <UButton
            v-else-if="article.starred === false"
            icon="i-fluent-star-12-regular"
            variant="ghost"
            @click="onStar"
          />
        </h1>
        <h4>
          {{ article?.author }}
        </h4>
        <div class="prose prose-lg prose-card prose-pink" v-html="content" />

        <ULink :href="article?.url ?? ''">Original article</ULink>
      </div>
    </div>
  </div>
</template>
