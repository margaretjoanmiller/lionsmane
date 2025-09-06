import { ArticleCard } from '@/components/article-card';
import { $api } from '@/lib/fetch-client';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/feed/$feedId')({
  loader: ({ params, context }) =>
    context.queryClient.ensureQueryData(
      $api.queryOptions('get', '/article/unread/feed/{id}', {
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
  const filter = useArticleFilterStore((state) => state.filter);

  if (filter === ArticleFilter.Unread) {
    const { data, isLoading } = $api.useSuspenseQuery(
      'get',
      '/article/unread/feed/{id}',
      {
        params: {
          path: {
            id: feedId,
          },
        },
        credentials: 'include',
      },
    );
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });
    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  } else if (filter === ArticleFilter.Read) {
    const { data, isLoading } = $api.useQuery(
      'get',
      '/article/read/feed/{id}',
      {
        params: { path: { id: feedId } },
        credentials: 'include',
      },
    );
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });

    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  } else if (filter === ArticleFilter.Starred) {
    const { data, isLoading } = $api.useQuery(
      'get',
      '/article/starred/feed/{id}',
      {
        credentials: 'include',
        params: { path: { id: feedId } },
      },
    );
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });

    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  } else if (filter === ArticleFilter.All) {
    const { data, isLoading } = $api.useQuery('get', '/article/feed/{id}', {
      credentials: 'include',
      params: { path: { id: feedId } },
    });
    if (isLoading || !data) return 'Loading...';

    const articles = data.articles.map((i) => {
      return <ArticleCard article={i} />;
    });

    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
    );
  }
}
