<script setup lang="ts">
const {login} = useOidcAuth()
</script>

<template>
  <NuxtLink to="/login">
    <Button>Login</Button>
  </NuxtLink>
</template>