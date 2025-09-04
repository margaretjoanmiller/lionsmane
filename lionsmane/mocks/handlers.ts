import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export const handlers = [
  http.get('https://example.com/robots.txt', () => {
    return HttpResponse.text(`
          User-agent: *
          Crawl-delay: 10
          # CSS, JS, Images
          Allow: /misc/*.css$
          Allow: /misc/*.css?
          Allow: /misc/*.js$`);
  }),
];

export const server = setupServer(...handlers);
