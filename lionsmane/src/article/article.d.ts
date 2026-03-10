import type { Atom, Json, Rdf, Rss } from 'feedsmith';
import type { OmitDeep } from 'type-fest';

export type ArticleMetaData = OmitDeep<
  Atom.Entry<Date> | Rss.Item<Date> | Json.Item<Date> | Rdf.Item<Date>,
  'url' | 'site_url' | 'lastChecked' | 'updated'
>;
