import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Collection, useDragAndDrop } from 'react-aria-components';
import { toast } from 'sonner';
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
    onError(e) {
      //@ts-expect-error: Error in openapi-typescript's typing of errors
      toast.error('Failed to delete folder', { description: e.message });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['get', '/feed'] });
      await queryClient.invalidateQueries({
        queryKey: ['get', '/folder/feed'],
      });
    },
  });
  const { mutate: editFeed } = $api.useMutation('patch', '/feed/{id}', {
    onError(e) {
      //@ts-expect-error: Error in openapi-typescript's typing of errors
      toast.error('Failed to edit feed', { description: e.message });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
    },
  });
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        // Search both top-level and nested items
        let item = treeData.find((i) => i.id === key);
        if (!item) {
          for (const parent of treeData) {
            item = parent.children?.find((child) => child.id === key);
            if (item) break;
          }
        }
        return {
          'application/json': JSON.stringify(item),
          'text/plain': item?.name || '',
        };
      }),
    async onItemDrop(e) {
      const data = e.items.filter((i) => i.kind === 'text')[0];
      if (!data) return;

      const parsed = JSON.parse(await data.getText('application/json'));

      // Only allow dragging feeds, not folders
      if (parsed.type !== 'feed') return;

      const target = treeData.find((i) => i.id === e.target.key);

      if (target?.type === 'folder') {
        editFeed({
          body: {
            folderId: target.id,
          },
          credentials: 'include',
          params: {
            path: {
              id: parsed.id,
            },
          },
        });
      }
    },
  });
  return (
    <Tree
      aria-label="Feeds and Folders"
      dragAndDropHooks={dragAndDropHooks}
      items={treeData}
      selectionMode="single"
    >
      {function renderItem(item) {
        return (
          <TreeItem textValue={item.name}>
            <TreeItemContent>
              {item.type === 'feed' ? (
                <Link
                  className="flex flex-row items-center max-w-40 space-x-3"
                  params={{ feedId: item.id }}
                  to="/dashboard/feed/$feedId"
                >
                  {item.favicon && (
                    <img
                      alt=""
                      aria-label={`${item.name} favicon`}
                      className="max-w-[16px] max-h-[16px]"
                      src={item.favicon}
                    />
                  )}
                  <span className="truncate">{item.name}</span>
                  <small>{item.unreadCount}</small>
                </Link>
              ) : (
                <ContextMenu>
                  <ContextMenuTrigger>
                    <Link
                      className="flex flex-row items-center max-w-35 space-x-2"
                      params={{ folderId: item.id }}
                      to="/dashboard/folder/$folderId"
                    >
                      <SolarFolderLineDuotone />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onSelect={() => {
                        deleteFolder({
                          credentials: 'include',
                          params: {
                            path: {
                              id: item.id,
                            },
                          },
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
