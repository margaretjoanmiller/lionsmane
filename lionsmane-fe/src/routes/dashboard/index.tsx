import { createFileRoute } from '@tanstack/react-router';
import { ArticleCard } from '@/components/article-card';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';

export const Route = createFileRoute('/dashboard/')({
  component: DashIndex,
});

function DashIndex() {
  const filter = useArticleFilterStore((state) => state.filter);

  if (filter === ArticleFilter.Unread) {
    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/unread',
        {
          credentials: 'include',
          params: {
            query: {
              pageSize: 12,
            },
          },
        },
        {
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

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
    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/read',
        {
          credentials: 'include',
        },
        {
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

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
    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/starred',
        {
          credentials: 'include',
        },
        {
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

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
    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article',
        {
          credentials: 'include',
        },
        {
          // @ts-expect-error: cursor typing
          getNextPageParam: (lastPage) => lastPage.cursor,
          initialPageParam: null,
        },
      );
    if (isLoading || !data) return 'Loading...';

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
