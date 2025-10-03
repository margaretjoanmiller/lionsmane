import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Collection, useDragAndDrop } from 'react-aria-components';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Tree,
  TreeItem,
  TreeItemContent,
  TreeItemExpandButton,
} from '@/components/ui/tree';
import { $api } from '@/lib/fetch-client';
import type { FeedTreeData } from '@/types/feed';
import FluentDelete16Regular from '~icons/fluent/delete-16-regular';
import SolarFolderLineDuotone from '~icons/solar/folder-line-duotone';

export default function FeedTree({ treeData }: { treeData: FeedTreeData[] }) {
  const queryClient = useQueryClient();
  const { mutate: deleteFolder } = $api.useMutation('delete', '/folder/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get', '/feed'] });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/folder/feed'],
      });
    },
    onError(e) {
      //@ts-expect-error: Error in openapi-typescript's typing of errors
      toast.error('Failed to delete folder', { description: e.message });
    },
  });
  const { mutate: editFeed } = $api.useMutation('patch', '/feed/{id}', {
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get', '/feed'] });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/folder/feed'],
      });
    },
    onError(e) {
      //@ts-expect-error: Error in openapi-typescript's typing of errors
      toast.error('Failed to edit feed', { description: e.message });
    },
  });
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        const item = treeData.find((i) => i.id === key);
        return {
          'text/plain': item?.name || '',
          'application/json': JSON.stringify(item),
        };
      }),
    async onItemDrop(e) {
      const data = e.items.filter((i) => i.kind === 'text')[0];
      const parsed = JSON.parse(await data.getText('application/json'));
      const target = treeData.find((i) => i.id === e.target.key);
      if (e.dropOperation === 'move' && target?.type === 'folder') {
        editFeed({
          params: {
            path: {
              id: parsed.id,
            },
          },
          credentials: 'include',
          body: {
            folderId: target?.id || null,
          },
        });
      }
    },
  });
  return (
    <Tree
      aria-label="Feeds and Folders"
      selectionMode="single"
      items={treeData}
      dragAndDropHooks={dragAndDropHooks}
    >
      {function renderItem(item) {
        return (
          <TreeItem textValue={item.name}>
            <TreeItemContent>
              {item.type === 'feed' ? (
                <Link
                  to="/dashboard/feed/$feedId"
                  className="flex flex-row items-center max-w-40 space-x-3"
                  params={{ feedId: item.id }}
                >
                  {item.favicon && (
                    <img
                      src={item.favicon}
                      alt={`${item.name} favicon`}
                      className="max-w-[16px] max-h-[16px]"
                    />
                  )}
                  <span className="truncate">{item.name}</span>
                  <small>{item.unreadCount}</small>
                </Link>
              ) : (
                <ContextMenu>
                  <ContextMenuTrigger>
                    <Link
                      to="/dashboard/folder/$folderId"
                      params={{ folderId: item.id }}
                      className="flex flex-row items-center max-w-35 space-x-2"
                    >
                      <SolarFolderLineDuotone />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onSelect={() => {
                        deleteFolder({
                          params: {
                            path: {
                              id: item.id,
                            },
                          },
                          credentials: 'include',
                        });
                      }}
                    >
                      <FluentDelete16Regular />
                      <span>Delete</span>
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              )}
              {item.children?.length ? <TreeItemExpandButton /> : null}
            </TreeItemContent>
            <Collection items={item.children || []}>{renderItem}</Collection>
          </TreeItem>
        );
      }}
    </Tree>
  );
}
