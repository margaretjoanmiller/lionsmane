import { createFileRoute } from '@tanstack/react-router';
import { ArticleCard } from '@/components/article-card';
import { SkeletonGrid } from '@/components/skeleton-grid';
import { Button } from '@/components/ui/button';
import { Empty, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { $api } from '@/lib/fetch-client';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';
import UilDesert from '~icons/uil/desert';

export const Route = createFileRoute('/dashboard/folder/$folderId')({
  component: FolderId,
});

function FolderId() {
  const folderId = Route.useParams().folderId;
  const filter = useArticleFilterStore((state) => state.filter);

  if (filter === ArticleFilter.Unread) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/unread/folder/{id}',
        {
          credentials: 'include',
          params: {
            path: {
              id: folderId,
            },
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

    const allArticles = data.pages.flatMap(({ articles }) =>
      articles.filter((i) => !i.isHidden),
    );

    if (allArticles.length === 0) {
      return (
        <Empty className="grow">
          <EmptyMedia variant="icon">
            <UilDesert fontSize="5em" />
          </EmptyMedia>
          <EmptyHeader>No articles</EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {allArticles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
        {hasNextPage && (
          <Button disabled={isFetching} onClick={() => fetchNextPage()}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.Read) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/read/folder/{id}',
        {
          credentials: 'include',
          params: {
            path: {
              id: folderId,
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

    const allArticles = data.pages.flatMap(({ articles }) =>
      articles.filter((i) => !i.isHidden),
    );

    if (allArticles.length === 0) {
      return (
        <Empty className="grow">
          <EmptyMedia variant="icon">
            <UilDesert fontSize="5em" />
          </EmptyMedia>
          <EmptyHeader>No articles</EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {allArticles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
        {hasNextPage && (
          <Button disabled={isFetching} onClick={() => fetchNextPage()}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.Starred) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/starred/folder/{id}',
        {
          credentials: 'include',
          params: {
            path: {
              id: folderId,
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

    const allArticles = data.pages.flatMap(({ articles }) =>
      articles.filter((i) => !i.isHidden),
    );

    if (allArticles.length === 0) {
      return (
        <Empty className="grow">
          <EmptyMedia variant="icon">
            <UilDesert fontSize="5em" />
          </EmptyMedia>
          <EmptyHeader>No articles</EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {allArticles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
        {hasNextPage && (
          <Button disabled={isFetching} onClick={() => fetchNextPage()}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  } else if (filter === ArticleFilter.All) {
    const { data, isLoading, isFetching, hasNextPage, fetchNextPage } =
      $api.useInfiniteQuery(
        'get',
        '/article/folder/{id}',
        {
          credentials: 'include',
          params: {
            path: {
              id: folderId,
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

    const allArticles = data.pages.flatMap(({ articles }) =>
      articles.filter((i) => !i.isHidden),
    );

    if (allArticles.length === 0) {
      return (
        <Empty className="grow">
          <EmptyMedia variant="icon">
            <UilDesert fontSize="5em" />
          </EmptyMedia>
          <EmptyHeader>No articles</EmptyHeader>
        </Empty>
      );
    }
    return (
      <>
        <div className="grid auto-rows-min gap-4 md:grid-cols-3">
          {allArticles.map((article) => (
            <ArticleCard article={article} key={article.id} />
          ))}
        </div>
        {hasNextPage && (
          <Button disabled={isFetching} onClick={() => fetchNextPage()}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </>
    );
  }
}
