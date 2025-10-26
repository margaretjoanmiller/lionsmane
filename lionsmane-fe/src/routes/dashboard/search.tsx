import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { ArticleCard } from '@/components/article-card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { $api } from '@/lib/fetch-client';
import MdiNullOff from '~icons/mdi/null-off';

const searchSchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  page: z.number().min(1).max(100).default(1),
  query: z.string().min(1).max(256),
});
export const Route = createFileRoute('/dashboard/search')({
  component: SearchResults,
  validateSearch: zodValidator(searchSchema),
});

function SearchResults() {
  const { query, page, limit } = Route.useSearch();

  const { data } = $api.useQuery('get', '/article/search', {
    credentials: 'include',
    params: {
      query: {
        limit,
        page,
        query,
      },
    },
  });

  if (data?.articles.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <MdiNullOff />
          </EmptyMedia>
          <EmptyTitle>No results</EmptyTitle>
        </EmptyHeader>
        <EmptyDescription>Try another search query</EmptyDescription>
      </Empty>
    );
  }
  const articles = data?.articles.map((art) => {
    return <ArticleCard article={art} />;
  });
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
  );
}
