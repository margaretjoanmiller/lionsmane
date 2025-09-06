import { ArticleCard } from '@/components/article-card';
import { Button } from '@/components/ui/button';
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
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
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
        {
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

    const articles = data.pages.map(({ articles }) => {
      return articles.map((i) => {
        return <ArticleCard article={i} />;
      });
    });
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {articles}
        </div>
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.Read) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/read/feed/{id}',
        {
          params: {
            path: {
              id: feedId,
            },
          },
          credentials: 'include',
        },
        {
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

    const articles = data.pages.map(({ articles }) => {
      return articles.map((i) => {
        return <ArticleCard article={i} />;
      });
    });
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {articles}
        </div>
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.Starred) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/starred/feed/{id}',
        {
          params: {
            path: {
              id: feedId,
            },
          },
          credentials: 'include',
        },
        {
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

    const articles = data.pages.map(({ articles }) => {
      return articles.map((i) => {
        return <ArticleCard article={i} />;
      });
    });
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {articles}
        </div>
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.All) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/feed/{id}',
        {
          params: {
            path: {
              id: feedId,
            },
          },
          credentials: 'include',
        },
        {
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

    const articles = data.pages.map(({ articles }) => {
      return articles.map((i) => {
        return <ArticleCard article={i} />;
      });
    });
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {articles}
        </div>
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  }
}
