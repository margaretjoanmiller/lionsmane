<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <p>hi! {{ route.params.id }}</p>
</template>

<style scoped></style>
