import { createFileRoute } from '@tanstack/react-router';

import ArticleList from '#/components/article-list';
import { articleStatusSearchSchema } from '#/lib/article-search';

export const Route = createFileRoute('/dash/')({
  validateSearch: articleStatusSearchSchema,
  component: DashIndex,
});

function DashIndex() {
  const { status } = Route.useSearch();
  return <ArticleList status={status} />;
}
