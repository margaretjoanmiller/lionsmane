import { createFileRoute } from '@tanstack/react-router';
import { zodValidator } from '@tanstack/zod-adapter';
import { z } from 'zod';
import { ArticleCard } from '@/components/article-card';
import { $api } from '@/lib/fetch-client';

const searchSchema = z.object({
  query: z.string().min(1).max(256),
  page: z.number().min(1).max(100).default(1),
  limit: z.number().min(1).max(100).default(10),
});
export const Route = createFileRoute('/dashboard/search')({
  validateSearch: zodValidator(searchSchema),
  component: SearchResults,
});

function SearchResults() {
  const { query, page, limit } = Route.useSearch();

  const { data } = $api.useQuery('get', '/article/search', {
    params: {
      query: {
        query,
        page,
        limit,
      },
    },
    credentials: 'include',
  });

  if (data?.articles.length === 0) {
    return <div>No results found</div>;
  }
  const articles = data?.articles.map((art) => {
    return <ArticleCard article={art} />;
  });
  return (
    <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
  );
}
