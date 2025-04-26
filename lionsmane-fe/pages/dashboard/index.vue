<!--
  - Copyright (c) 2025 Margaret Miller. Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: "dash",
  middleware: "authenticated",
});
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <div class="bg-muted/50 aspect-video rounded-xl" />
    <div class="bg-muted/50 aspect-video rounded-xl" />
    <div class="bg-muted/50 aspect-video rounded-xl" />
  </div>
</template>
