import React from 'react';
import { $api } from '@/lib/fetch-client';
import type { FeedTreeData } from '@/types/feed';

export function useFeedTree() {
  const { data: folders, isFetching: foldersLoading } = $api.useQuery(
    'get',
    '/folder/feeds',
    {
      credentials: 'include',
    },
  );

  const { data: feeds, isFetching: feedsLoading } = $api.useQuery(
    'get',
    '/feed',
    {
      credentials: 'include',
    },
  );

  const initialItems: FeedTreeData[] = React.useMemo(() => {
    const orphanedFeeds =
      feeds
        ?.filter((feed) => feed.folderId == null)
        .map((feed) => ({
          children: [],
          favicon: feed.favicon,
          folderId: null,
          id: feed.id,
          name: feed.title || feed.url,
          type: 'feed' as const,
          unreadCount: feed.unreadCount,
        })) || [];

    const folderFeeds =
      folders?.map((folder) => ({
        children: folder.feeds.map((feed) => ({
          children: [],
          favicon: feed.favicon,
          folderId: folder.id,
          id: feed.id,
          name: feed.title || feed.url,
          type: 'feed' as const,
          unreadCount: feeds?.find((f) => f.id === feed.id)?.unreadCount || 0,
        })),
        favicon: null,
        folderId: folder.id,
        id: folder.id,
        name: folder.name,
        type: 'folder' as const,
        unreadCount: null,
      })) || [];

    return [...folderFeeds, ...orphanedFeeds];
  }, [folders, feeds]);

  return {
    feeds,
    folders,
    initialItems,
    isLoading: foldersLoading || feedsLoading,
  };
}
