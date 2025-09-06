import { createFileRoute } from '@tanstack/react-router';
import { $api } from '@/lib/fetch-client';

export const Route = createFileRoute('/dashboard/$articleId')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      $api.queryOptions('get', '/article/{id}', {
        params: {
          path: {
            id: params.articleId,
          },
        },
        credentials: 'include',
      }),
    ),
    component: ArticlePage
});

function ArticlePage() {
  const articleId = Route.useParams().articleId;
  const { data } = $api.useSuspenseQuery('get', '/article/{id}', {
    params: {
      path: {
        id: articleId,
      },
    },
    credentials: 'include',
  });

  return <>{data.readableText}</>;
}
