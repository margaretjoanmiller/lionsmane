<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
const { articlePreview } = defineProps<{
  articlePreview: {
    id: string;
    title: string;
    preview: string | undefined;
    date: string;
    isRead: boolean;
    starred: boolean;
  };
}>();

const toast = useToast();
const queryClient = useQueryClient();

type ArticleStarring = {
  id: string;
  starred: boolean;
};
const { isError, error, isSuccess, mutate } = useMutation({
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
    await queryClient.invalidateQueries({ queryKey: ['articles'] });
  },
  onError: () => {
    toast.add({ title: 'Error setting article as read', color: 'error' });
  },
  retry: 3,
});

function onStar() {
  mutate({
    id: articlePreview.id,
    starred: true,
  });
}
function onUnStar() {
  mutate({
    id: articlePreview.id,
    starred: false,
  });
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        <NuxtLink
          :to="{
            name: 'dashboard-articles-id',
            params: { id: articlePreview.id },
          }"
        >
          {{ articlePreview.title }}
        </NuxtLink>
        <div class="">
          <div v-show="articlePreview.isRead === false">
            <UBadge icon="radix-icons:dot-filled" color="info">Unread</UBadge>
          </div>
          <UButton
            v-if="articlePreview.starred === true"
            icon="i-fluent-star-12-filled"
            variant="ghost"
            @click="onUnStar"
          />
          <UButton
            v-else-if="articlePreview.starred === false"
            icon="i-fluent-star-12-regular"
            variant="ghost"
            @click="onStar"
          />
        </div>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex-1">
        <p class="mt-1">{{ articlePreview.preview }}</p>
      </div>
    </CardContent>
    <CardFooter>
      {{ new Date(articlePreview.date).toLocaleDateString() }}
    </CardFooter>
  </Card>
</template>
