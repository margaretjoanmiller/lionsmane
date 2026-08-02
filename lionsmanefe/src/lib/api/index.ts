import createFetchClient from 'openapi-fetch';
import createClient from 'openapi-react-query';

import type { paths } from './v1';

export const fetchClient = createFetchClient<paths>({
  baseUrl: 'http://localhost:4000',
  credentials: 'include',
});
export const $api = createClient(fetchClient);
