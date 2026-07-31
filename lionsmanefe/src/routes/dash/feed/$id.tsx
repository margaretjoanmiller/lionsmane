import { createFileRoute } from '@tanstack/react-router';

import ArticleList from '#/components/article-list';
import { articleStatusSearchSchema } from '#/lib/article-search';

export const Route = createFileRoute('/dash/feed/$id')({
  validateSearch: articleStatusSearchSchema,
  component: FeedArticles,
});

function FeedArticles() {
  const { id } = Route.useParams();
  const { status } = Route.useSearch();
  return <ArticleList feedId={id} status={status} />;
}
