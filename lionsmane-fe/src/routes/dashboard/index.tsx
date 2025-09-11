import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
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
  const [isHidden, setHidden] = React.useState(true);

  if (filter === ArticleFilter.Unread) {
    const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/unread',
        {
          credentials: 'include',
        },
        {
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
    const areHiddenArticles = data.pages.some(({ articles }) =>
      articles.some((i) => i.isHidden),
    );
    const hiddenArticles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => i.isHidden)
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
        {areHiddenArticles && isHidden && (
          <Button onClick={() => setHidden(false)}>
            Show hidden articles?
          </Button>
        )}
        {!isHidden && (
          <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
            {hiddenArticles}
            <Button onClick={() => setHidden(true)}>Hide articles?</Button>
          </div>
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
    const areHiddenArticles = data.pages.some(({ articles }) =>
      articles.some((i) => i.isHidden),
    );
    const hiddenArticles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => i.isHidden)
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
        {areHiddenArticles && isHidden && (
          <Button>Show hidden articles?</Button>
        )}
        {!isHidden && (
          <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
            {hiddenArticles}
          </div>
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
    const areHiddenArticles = data.pages.some(({ articles }) =>
      articles.some((i) => i.isHidden),
    );
    const hiddenArticles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => i.isHidden)
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
        {areHiddenArticles && isHidden && (
          <Button>Show hidden articles?</Button>
        )}
        {!isHidden && (
          <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
            {hiddenArticles}
          </div>
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

    const areHiddenArticles = data.pages.some(({ articles }) =>
      articles.some((i) => i.isHidden),
    );

    const hiddenArticles = data.pages.map(({ articles }) => {
      return articles
        .filter((i) => i.isHidden)
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
        {areHiddenArticles && isHidden && (
          <Button>Show hidden articles?</Button>
        )}
        {!isHidden && (
          <div className="mt-4 grid auto-rows-min gap-4 md:grid-cols-3">
            {hiddenArticles}
          </div>
        )}
      </>
    );
  }
}
