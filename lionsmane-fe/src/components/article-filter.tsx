'use client';

import * as React from 'react';

import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useArticleFilterStore } from '@/stores/articleFilter.store';
import {
  Select,
  SelectContent,
  SelectValue,
  SelectTrigger,
  SelectItem,
} from '@/components/ui/select';

type Status = {
  value: string;
  label: string;
};

const statuses: Status[] = [
  { label: 'Unread', value: 'unread' },
  { label: 'Read', value: 'read' },
  { label: 'Starred', value: 'starred' },
  { label: 'All', value: 'all' },
];

export function ArticleFilterSelect() {
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();
  const [selectedStatus, setSelectedStatus] = React.useState<Status | null>({
    label: 'Unread',
    value: 'unread',
  });
  const setUnread = useArticleFilterStore((state) => state.setToUnread);
  const setStarred = useArticleFilterStore((state) => state.setToStarred);
  const setRead = useArticleFilterStore((state) => state.setToRead);
  const setAll = useArticleFilterStore((state) => state.setToAll);

  return (
    <Select
      onValueChange={(value) => {
        if (value === 'unread') {
          setUnread();
        } else if (value === 'read') {
          setRead();
        } else if (value === 'starred') {
          setStarred();
        } else if (value === 'all') {
          setAll();
        }
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="unread">Unread</SelectItem>
        <SelectItem value="read">Read</SelectItem>
        <SelectItem value="starred">Starred</SelectItem>
        <SelectItem value="all">All</SelectItem>
      </SelectContent>
    </Select>
  );
}
