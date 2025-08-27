<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later.
  -->

<template>
  <div
    class="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10"
  >
    <div class="flex w-full max-w-sm flex-col gap-6">
      <a href="/" class="flex items-center gap-2 self-center font-medium">
        <div
          class="bg-primary text-primary-foreground flex h-6 w-6 items-center justify-center rounded-md"
        >
          <Icon name="noto:mushroom" />
        </div>
        lionsmane
      </a>
      <LoginForm />
    </div>
  </div>
</template>
