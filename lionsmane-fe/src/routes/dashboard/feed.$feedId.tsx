import { createFileRoute } from '@tanstack/react-router';
import { ArticleCard } from '@/components/article-card';
import { SkeletonGrid } from '@/components/skeleton-grid';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';

export const Route = createFileRoute('/dashboard/feed/$feedId')({
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
            query: {
              pageSize: 12,
            },
          },
          credentials: 'include',
        },
        {
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => !i.isHidden)
        .map((i) => {
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
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );

    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => !i.isHidden)
        .map((i) => {
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
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => !i.isHidden)
        .map((i) => {
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
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => !i.isHidden)
        .map((i) => {
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
