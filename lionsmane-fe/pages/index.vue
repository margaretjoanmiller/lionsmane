<script setup lang="ts">
const { loggedIn, login, logout } = useOidcAuth();
</script>

<template>
  <div v-if="loggedIn">
    <button @click="logout()">Logout</button>
  </div>
  <div v-else>
    <button @click="login()">Login with default provider</button>
  </div>
</template>
