import { createFileRoute } from '@tanstack/react-router';
import { ArticleCard } from '@/components/article-card';
import { SkeletonGrid } from '@/components/skeleton-grid';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import UilDesert from '~icons/uil/desert';
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
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-60">
            <UilDesert fontSize="5em" />
            <p>No articles</p>
          </div>
        );
      }
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
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-60">
            <UilDesert fontSize="5em" />
            <p>No articles</p>
          </div>
        );
      }
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
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-60">
            <UilDesert fontSize="5em" />
            <p>No articles</p>
          </div>
        );
      }
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
    if (isLoading || !data) return <SkeletonGrid />;

    const articles = data.pages.map(({ articles }) => {
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-60">
            <UilDesert fontSize="5em" />
            <p>No articles</p>
          </div>
        );
      }
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
