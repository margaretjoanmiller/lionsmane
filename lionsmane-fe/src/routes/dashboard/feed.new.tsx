import { createFileRoute } from '@tanstack/react-router';
import { AddFeed } from '@/components/add-feed';

export const Route = createFileRoute('/dashboard/feed/new')({
  component: FeedNewPage,
});

function FeedNewPage() {
  return <AddFeed />;
}
