import { useNavigate } from '@tanstack/react-router';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ArticleFilterBar({
  feedId,
  status,
}: {
  feedId: string | undefined;
  status: 'all' | 'unread' | 'read' | 'starred' | undefined;
}) {
  const currentStatus = status ?? 'unread';
  const navigate = useNavigate();

  return (
    <div role="group">
      <ToggleGroup
        selectionMode="single"
        disallowEmptySelection
        selectedKeys={[currentStatus]}
        onSelectionChange={(keys) => {
          const nextStatus = [...keys][0];
          if (nextStatus) {
            const status =
              nextStatus === 'all'
                ? ('all' as const)
                : nextStatus === 'unread'
                  ? ('unread' as const)
                  : nextStatus === 'read'
                    ? ('read' as const)
                    : ('starred' as const);

            if (feedId) {
              navigate({
                to: '/dash/feed/$id',
                params: {
                  id: feedId,
                },
                search: {
                  status,
                },
              });
            } else {
              navigate({ to: '/dash', search: { status } });
            }
          }
        }}
      >
        <ToggleGroupItem id="all" aria-label="All articles">
          All
        </ToggleGroupItem>
        <ToggleGroupItem id="unread" aria-label="Unread articles">
          Unread
        </ToggleGroupItem>
        <ToggleGroupItem id="read" aria-label="Read articles">
          Read
        </ToggleGroupItem>
        <ToggleGroupItem id="starred" aria-label="Starred articles">
          Starred
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
