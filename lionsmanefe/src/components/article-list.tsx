import DesertIcon from '~icons/twemoji/desert';

import { $api } from '../lib/api';
import { ArticleCard } from './article-card';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';
import { Skeleton } from './ui/skeleton';

export type ArticleListProps = {
  feedId?: string;
  status?: 'unread' | 'read' | 'starred';
};

const SKELETON_COUNT = 9;

function ArticleCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-5 w-3/4" />
        </CardTitle>
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="aspect-video w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </CardContent>
    </Card>
  );
}

export default function ArticleList({ feedId, status }: ArticleListProps) {
  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } = $api.useInfiniteQuery(
    'get',
    '/article',
    {
      params: {
        query: {
          ...(feedId ? { feedId } : {}),
          ...(status ? { status } : {}),
        },
      },
    },
    {
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
    },
  );

  if (isLoading) {
    return (
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {Array.from({ length: SKELETON_COUNT }, (_, i) => (
          <ArticleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const allArticles = data.pages.flatMap(({ articles }) => articles);

  if (allArticles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <DesertIcon height="1em" />
          </EmptyMedia>
          <EmptyTitle>No articles found</EmptyTitle>
        </EmptyHeader>
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
        <Button isDisabled={isFetching} onClick={() => fetchNextPage()}>
          {isFetching ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </>
  );
}
