<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->
<script setup lang="ts">
definePageMeta({
  layout: 'dash',
});

const toast = useToast()
const route = useRoute();
const queryClient = useQueryClient();

const { session } = useUserSession();

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

const content = computed(
  () => article.value?.content ?? article.value?.textPreview,
);

const enabled = computed(() => !!article.value?.id)

const { isError, error, isSuccess, mutate } = useMutation({
  mutationFn: (feedId: string) =>
    $lion('/articles/read/{id}', {
      method: 'patch',
      path: {
        id: feedId,
      },
    }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['articles'] });
  },
  onError: () => {
    toast.add({ title: 'Error setting article as read', color: 'error' })
  },
  retry: 3
});


mutate(id)
</script>

<template>
  <div v-if="!isPendingArticles && article"
    class="flex flex-col gap-6 rounded-xl border bg-card py-6 text-card-foreground shadow-sm">
    <div class="m-6">
      <h1 class="mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
        {{ article?.title }}
      </h1>
      <h4>
        {{ article?.author }}
      </h4>
      <div class="prose prose-lg prose-card prose-pink" v-html="content"></div>

      <a :href="article?.url ?? ''">Original article</a>
    </div>
  </div>
</template>
