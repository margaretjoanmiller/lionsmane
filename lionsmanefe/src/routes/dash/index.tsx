import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

import ArticleList from '#/components/article-list';
import { articleStatusSearchSchema, defaultArticleStatusSearch } from '#/lib/article-search';

export const Route = createFileRoute('/dash/')({
  validateSearch: articleStatusSearchSchema,
  search: {
    middlewares: [stripSearchParams(defaultArticleStatusSearch)],
  },
  component: DashIndex,
});

function DashIndex() {
  const { status } = Route.useSearch();
  return <ArticleList status={status} />;
}
