<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
definePageMeta({
  layout: "dash",
  name: "dashboard-home",
});
</script>

<template>
  <div class="grid auto-rows-min gap-4 md:grid-cols-3">
    <span>Welcome home!</span>
    <NuxtLink to="/dashboard/feeds">Feeds</NuxtLink>
  </div>
</template>
