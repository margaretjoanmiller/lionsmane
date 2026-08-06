import { createFileRoute, stripSearchParams } from '@tanstack/react-router';

import ArticleList from '#/components/article-list';
import { articleStatusSearchSchema, defaultArticleStatusSearch } from '#/lib/article-search';

export const Route = createFileRoute('/dash/feed/$id')({
  validateSearch: articleStatusSearchSchema,
  search: {
    middlewares: [stripSearchParams(defaultArticleStatusSearch)],
  },
  component: FeedArticles,
});

function FeedArticles() {
  const { id } = Route.useParams();
  const { status } = Route.useSearch();
  return <ArticleList feedId={id} status={status} />;
}
