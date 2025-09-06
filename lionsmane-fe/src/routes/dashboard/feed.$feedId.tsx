import { $api } from '@/lib/fetch-client';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/feed/$feedId')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      $api.queryOptions('get', '/article/feed/{id}', {
        params: {
          path: {
            id: params.feedId,
          },
        },
        credentials: 'include',
      }),
    ),
  component: FeedId,
});

function FeedId() {
  const feedId = Route.useParams().feedId;
  const { data } = $api.useSuspenseQuery('get', '/article/feed/{id}', {
    params: {
      path: {
        id: feedId,
      },
    },
    credentials: 'include',
  });
}
