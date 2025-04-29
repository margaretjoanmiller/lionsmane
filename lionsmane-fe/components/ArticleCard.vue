<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
defineProps<{
  articlePreview: {
    title: string;
    preview: string | undefined;
    date: string;
  };
}>();
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>
        {{ articlePreview.title }}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex-1">
        <p class="mt-1">{{ articlePreview.preview }}</p>
      </div>
    </CardContent>
    <CardFooter>
      {{ articlePreview.date }}
    </CardFooter>
  </Card>
</template>
