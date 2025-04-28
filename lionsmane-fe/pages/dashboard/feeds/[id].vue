<script setup lang="ts">
const route = useRoute();
</script>

<template>
  <p>hi! {{ route.params.id }}</p>
</template>

<style scoped></style>
