import { useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Collection, useDragAndDrop } from 'react-aria-components';
import { useTreeData } from 'react-stately';
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
  const tree = useTreeData<FeedTreeData>({
    initialItems: treeData,
    getKey: (item) => item.id,
    getChildren: (item) => item.children || [],
  });

  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => {
        const item = tree.getItem(key)?.value;
        return {
          'text/plain': item?.name || '',
          'application/json': JSON.stringify(item),
        };
      }),
    onMove(e) {
      if (e.target.dropPosition === 'before') {
        tree.moveBefore(e.target.key, e.keys);
        const key = Array.from(e.keys)[0];
        const data = tree.getItem(key)?.value;
        if (data && data.folderId) {
          editFeed({
            params: {
              path: { id: data.id },
            },
            credentials: 'include',
            body: {
              folderId: null,
            },
          });
        }
      } else if (e.target.dropPosition === 'after') {
        tree.moveAfter(e.target.key, e.keys);
        const key = Array.from(e.keys)[0];
        const data = tree.getItem(key)?.value;
        if (data && data.folderId) {
          editFeed({
            params: {
              path: { id: data.id },
            },
            credentials: 'include',
            body: {
              folderId: null,
            },
          });
        }
      } else if (e.target.dropPosition === 'on') {
        // Move items to become children of the target
        const targetNode = tree.getItem(e.target.key);
        const targetData = targetNode?.value;
        if (targetNode && targetData?.type === 'folder') {
          const targetIndex = targetNode.children
            ? targetNode.children.length
            : 0;
          const keyArray = Array.from(e.keys);
          for (let i = 0; i < keyArray.length; i++) {
            tree.move(keyArray[i], e.target.key, targetIndex + i);
          }
        }
      }
    },
    async onItemDrop(e) {
      const data = e.items.filter((i) => i.kind === 'text')[0];
      const parsed = JSON.parse(await data.getText('application/json'));
      const target = tree.getItem(e.target.key)?.value;
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
      items={tree.items}
      selectedKeys={tree.selectedKeys}
      dragAndDropHooks={dragAndDropHooks}
    >
      {function renderItem(item) {
        return (
          <TreeItem textValue={item.value.name}>
            <TreeItemContent>
              {item.value.type === 'feed' ? (
                <Link
                  to="/dashboard/feed/$feedId"
                  className="flex flex-row items-center max-w-40 space-x-3"
                  params={{ feedId: item.value.id }}
                >
                  {item.value.favicon && (
                    <img
                      src={item.value.favicon}
                      alt={`${item.value.name} favicon`}
                      className="max-w-[16px] max-h-[16px]"
                    />
                  )}
                  <span className="truncate">{item.value.name}</span>
                  <small>{item.value.unreadCount}</small>
                </Link>
              ) : (
                <ContextMenu>
                  <ContextMenuTrigger>
                    <Link
                      to="/dashboard/folder/$folderId"
                      params={{ folderId: item.value.id }}
                      className="flex flex-row items-center max-w-35 space-x-2"
                    >
                      <SolarFolderLineDuotone />
                      <span className="truncate">{item.value.name}</span>
                    </Link>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      onSelect={() => {
                        deleteFolder({
                          params: {
                            path: {
                              id: item.value.id,
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
