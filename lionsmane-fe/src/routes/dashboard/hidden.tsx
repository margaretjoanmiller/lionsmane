import { createFileRoute } from '@tanstack/react-router';
import { type Tag, TagInput } from 'emblor';
import React from 'react';
import { ArticleCard } from '@/components/article-card';
import { Button } from '@/components/ui/button';
import { $api } from '@/lib/fetch-client';

export const Route = createFileRoute('/dashboard/hidden')({
  component: HiddenDashboard,
});

function HiddenDashboard() {
  const { data: filters } = $api.useQuery('get', '/filter', {
    credentials: 'include',
  });
  const keywordFilters =
    filters
      ?.filter(
        (f) => f.conditions?.keywords && f.conditions.keywords.length > 0,
      )
      .flatMap((f) => f.conditions.keywords)
      .flatMap((keyword) => ({
        id: keyword || '',
        text: keyword || '',
      })) || ([] as Tag[]);
  const containsFilters =
    filters
      ?.filter(
        (f) => f.conditions?.contentContains || f.conditions.titleContains,
      )
      .flatMap(
        (conditions) =>
          conditions.conditions.contentContains ||
          conditions.conditions.titleContains,
      )
      .flatMap((contains) => ({
        id: contains || '',
        text: contains || '',
      })) || ([] as Tag[]);

  const [selectedKeywordFilter, setSelectedKeywordFilter] = React.useState<
    Tag[]
  >([]);
  const [selectedKeywordIndex, setSelectedKeywordIndex] = React.useState<
    number | null
  >(null);
  const [selectedContainsFilter, setSelectedContainsFilter] =
    React.useState<Tag[]>(containsFilters);

  const { data, isLoading, isFetching, fetchNextPage, hasNextPage } =
    $api.useInfiniteQuery(
      'get',
      '/article/hidden',
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
    return articles.map((i) => {
      return <ArticleCard article={i} />;
    });
  });

  return (
    <>
      <div className="flex flex-row gap-3">
        <TagInput
          placeholder="Enter a topic"
          tags={selectedKeywordFilter}
          enableAutoComplete={true}
          autocompleteOptions={keywordFilters}
          className="sm:min-w-[450px]"
          activeTagIndex={selectedKeywordIndex}
          activeTags={selectedKeywordFilter}
          setTags={(newTags) => {
            setSelectedKeywordFilter(newTags);
          }}
          setActiveTagIndex={setSelectedKeywordIndex}
        />
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">{articles}</div>
      {hasNextPage && (
        <Button onClick={() => fetchNextPage()} disabled={isFetching}>
          {isFetching ? 'Loading...' : 'Load More'}
        </Button>
      )}
    </>
  );
}
