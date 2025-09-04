<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->
<script setup lang="ts">
import { apiClient } from '@/utils/apiClient';

definePageMeta({
  layout: 'dash',
});

const toast = useToast();
const route = useRoute();
const queryClient = useQueryClient();

let id: string;
if (Array.isArray(route.params.id)) {
  if (route.params.id[0]) {
    id = route.params.id[0];
  } else {
    throw new Error('No article ID provided');
  }
} else {
  if (route.params.id) {
    id = route.params.id;
  } else {
    throw new Error('No article ID provided');
  }
}

const {
  isPending: isPendingArticles,
  isError: isErrorArticles,
  data: article,
  error: articlesError,
} = useQuery({
  queryKey: ['articles', { articleId: id }],
  queryFn: async () => {
    const { data, error } = await apiClient.GET('/article/{id}', {
      params: {
        path: {
          id,
        },
      },
      credentials: 'include',
    });
    if (error) {
      throw new Error(`Failed to fetch feeds: ${error}`);
    }
    return data;
  },
});

// we clean the HTML server-side
const content = computed(
  () => article.value?.readableText ?? '<p>No content</p>',
);

const { isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (artId: string) =>
    apiClient.PATCH('/article/status/{id}', {
      method: 'PATCH',
      params: {
        path: {
          id: artId,
        },
        query: {
          status: 'read',
        },
      },
      credentials: 'include',
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
    apiClient.PATCH('/article/status/{id}', {
      method: 'PATCH',
      params: {
        path: {
          id: art.id,
        },
        query: {
          status: 'starred',
        },
      },
      credentials: 'include',
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
            v-if="article.isStarred === true"
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
