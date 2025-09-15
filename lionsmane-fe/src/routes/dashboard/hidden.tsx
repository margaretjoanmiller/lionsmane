import { createFileRoute } from '@tanstack/react-router';
import React from 'react';
import { ArticleCard } from '@/components/article-card';
import MultipleSelector, { type Option } from '@/components/multi-select';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';

export const Route = createFileRoute('/dashboard/hidden')({
  component: HiddenDashboard,
});

function HiddenDashboard() {
  const [selectedRules, setSelectedRules] = React.useState<Option[]>([]);

  const { data: filters } = $api.useQuery('get', '/filter', {
    credentials: 'include',
  });

  const filterOptions = filters?.map((filter) => ({
    label: filter.name || filter.id,
    value: filter.id,
  }));

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    $api.useInfiniteQuery(
      'get',
      '/article/hidden',
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

  function handleFilterChange(value: Option[]) {
    setSelectedRules(value);
  }

  const allArticles = data.pages.flatMap((page) => page.articles);

  const visibleArticles = allArticles.filter((article) => {
    // If no rules are selected, show all articles.
    if (selectedRules.length === 0) {
      return true;
    }
    return selectedRules.map((rule) => rule.value).includes(article.ruleId);
  });

  return (
    <>
      <div className="flex gap-4 mb-6">
        <MultipleSelector
          defaultOptions={filterOptions || []}
          onChange={handleFilterChange}
          value={selectedRules}
        />
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {visibleArticles.map((article) => (
          <ArticleCard article={article} />
        ))}
        {hasNextPage && (
          <Button onClick={() => fetchNextPage()} disabled={isFetching}>
            {isFetching ? 'Loading...' : 'Load More'}
          </Button>
        )}
      </div>
    </>
  );
}
