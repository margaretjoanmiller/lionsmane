import { Link } from '@tanstack/react-router';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function ArticleFilterBar({
  feedId,
  status,
}: {
  feedId: string | undefined;
  status: 'unread' | 'read' | 'starred' | undefined;
}) {
  const currentStatus = status ?? 'all';

  return (
    <div role="group">
      <ToggleGroup selectionMode="single" selectedKeys={[currentStatus]}>
        <ToggleGroupItem id="all" aria-label="All articles">
          {feedId ? (
            <Link to="/dash/feed/$id" params={{ id: feedId }}>
              All
            </Link>
          ) : (
            <Link to="/dash" params={{ id: feedId }}>
              All
            </Link>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem id="unread" aria-label="Unread articles">
          {feedId ? (
            <Link to="/dash/feed/$id" params={{ id: feedId }} search={{ status: 'unread' }}>
              Unread
            </Link>
          ) : (
            <Link to="/dash" params={{ id: feedId }} search={{ status: 'unread' }}>
              Unread
            </Link>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem id="read" aria-label="Read articles">
          {feedId ? (
            <Link to="/dash/feed/$id" params={{ id: feedId }} search={{ status: 'read' }}>
              Read
            </Link>
          ) : (
            <Link to="/dash" params={{ id: feedId }} search={{ status: 'read' }}>
              Read
            </Link>
          )}
        </ToggleGroupItem>
        <ToggleGroupItem id="starred" aria-label="Starred articles">
          {feedId ? (
            <Link to="/dash/feed/$id" params={{ id: feedId }} search={{ status: 'starred' }}>
              Starred
            </Link>
          ) : (
            <Link to="/dash" params={{ id: feedId }} search={{ status: 'starred' }}>
              Starred
            </Link>
          )}
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
