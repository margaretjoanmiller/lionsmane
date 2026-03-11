import type { Atom, Json, Rdf, Rss } from 'feedsmith';
import type { OmitDeep } from 'type-fest';

export type FeedMetaData = OmitDeep<
  Atom.Feed<Date> | Rss.Feed<Date> | Json.Feed<Date> | Rdf.Feed<Date>,
  'url' | 'site_url' | 'lastChecked' | 'updated' | 'items' | 'entries'
>;
