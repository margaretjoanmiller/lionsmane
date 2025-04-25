<script setup lang="ts">

defineProps<{
  articlePreview: {
    title: string,
    preview: string,
  }
}>()
</script>

<template>
  <Card>
    <CardTitle>
      {{articlePreview.title}}
    </CardTitle>
    <CardContent>
      <div class="flex-1">
        <p class="mt-1">{{articlePreview.preview}}</p>
      </div>
    </CardContent>
  </Card>

</template>
