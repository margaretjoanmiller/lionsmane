<!--
  - Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
  -->

<script setup lang="ts">
definePageMeta({
  layout: "dash",
});

import { useMutation } from "@pinia/colada";
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { Row } from "@tanstack/vue-table";
import type { SchemaFeedDto } from "@/utils/gen/schema";

const UButton = resolveComponent("UButton");
const UBadge = resolveComponent("UBadge");
const UDropdownMenu = resolveComponent("UDropdownMenu");

const toast = useToast();

const { user } = useOidcAuth();

const feedStore = useFeedStore();

const data = computed(() => feedStore.feeds);

const {
  mutate: deleteFolder,
  status,
  asyncStatus,
} = useMutation({
  mutation: (id: string) => {
    return $lion(`/feeds/delete/${id}`, {
      headers: {
        Authorization: `Bearer ${user.value?.accessToken}`,
      },
    });
  },
});

const columns: TableColumn<SchemaFeedDto>[] = [
  {
    accessorKey: "id",
    header: "#",
  },
  {
    accessorKey: "title",
    header: "title",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "url",
    header: "URL",
  },
  {
    accessorKey: "lastUpdated",
    header: "Date",
    cell: ({ row }) => {
      return new Date(row.getValue("lastUpdated")).toLocaleString("en-US", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    },
  },
  {
    accessorKey: "folderId",
    header: "Folder",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      return h(
        "div",
        { class: "text-right" },
        h(
          UDropdownMenu,
          {
            content: {
              align: "end",
            },
            items: getRowItems(row),
            "aria-label": "Actions dropdown",
          },
          () =>
            h(UButton, {
              icon: "i-lucide-ellipsis-vertical",
              color: "neutral",
              variant: "ghost",
              class: "ml-auto",
              "aria-label": "Actions dropdown",
            }),
        ),
      );
    },
  },
];

function getRowItems(row: Row<SchemaFeedDto>) {
  return [
    {
      type: "label",
      label: "Actions",
    },
    {
      label: "Delete",
      onSelect() {
        deleteFolder(row.getValue("id"));
      },
    },
  ];
}
</script>

<template>
  <UTable :data="data" :columns="columns" class="flex-1" />
</template>
