<script setup lang="ts">
const {loggedIn} = useOidcAuth()

if(loggedIn.value) {
 await navigateTo("/dashboard")
}
</script>

<template>
  <div class="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
    <div class="flex w-full max-w-sm flex-col gap-6">
<!--      <a href="#" class="flex items-center gap-2 self-center font-medium">-->
        <div class="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Icon name="noto:mushroom"/>
        </div>
        lionsmane
<!--      </a>-->
      <LoginForm />
    </div>
  </div>
</template>
