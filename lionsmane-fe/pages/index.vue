<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->
<script setup lang="ts">
const { getSession, data } = useAuth();

const session = await getSession();

if (session) {
  await navigateTo('/dashboard');
}
</script>

<template>
  <NuxtLink to="/login">
    <Button>Login</Button>
  </NuxtLink>
</template>
