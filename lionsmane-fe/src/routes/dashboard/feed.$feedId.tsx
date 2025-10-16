import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { toast } from 'sonner';
import UilDesert from '~icons/uil/desert';
import { ArticleCard } from '@/components/article-card';
import { SkeletonGrid } from '@/components/skeleton-grid';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';
import {
  ArticleFilter,
  useArticleFilterStore,
} from '@/stores/articleFilter.store';

export const Route = createFileRoute('/dashboard/feed/$feedId')({
  component: FeedId,
});

function AlertMarkRead({ feedId }: { feedId: string }) {
  const queryClient = useQueryClient();
  const { mutate } = $api.useMutation('post', '/feed/mark-all-read/{id}', {
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast.success('Marked all articles from feed as read');
    },
  });

  function markAllAsRead() {
    mutate({
      params: {
        path: {
          id: feedId,
        },
      },
      credentials: 'include',
    });
  }
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Mark all read</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will mark all articles in this feed as read.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={markAllAsRead}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

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
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-50">
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
        <div className="flex gap-4 mb-6">
          <AlertMarkRead feedId={feedId} />
        </div>
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
      if (articles.length === 0) {
        return <UilDesert />;
      }
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-50">
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
        <div className="flex gap-4 mb-6">
          <AlertMarkRead feedId={feedId} />
        </div>
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
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-50">
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
        <div className="flex gap-4 mb-6">
          <AlertMarkRead feedId={feedId} />
        </div>
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
      if (articles.length === 0) {
        return (
          <div className="absolute place-self-center items-center transform translate-y-50">
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
        <div className="flex gap-4 mb-6">
          <AlertMarkRead feedId={feedId} />
        </div>
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
