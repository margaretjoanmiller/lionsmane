<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
defineProps<{
  articlePreview: {
    id: string;
    title: string;
    preview: string | undefined;
    date: string;
    isRead: boolean;
  };
}>();

</script>

<template>
  <NuxtLink :to="{ name: 'dashboard-articles-id', params: { id: articlePreview.id } }" @click="">
    <Card>
      <CardHeader>
        <CardTitle>
          {{ articlePreview.title }}
          <div v-show="articlePreview.isRead === false">
            <UBadge icon="radix-icons:dot-filled" color="info">Unread</UBadge>
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
  </NuxtLink>
</template>
