import { articleDetail } from 'lionsmane-common';
export const articleDetailWithStatus = articleDetail.extend({}).omit({
  minifluxId: true,
});
