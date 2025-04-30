/*
 * Copyright (c) 2025 Margaret Miller.  Licensed under the EUPL-1.2-or-later
 */

/** @type {import("tailwindcss").Config} */
module.exports = {
  theme: {
    extend: {
      typography: () => ({
        card: {
          css: {
            "--tw-prose-body": "var(--card-foreground)",
            "--tw-prose-headings": "var(--card-foreground)",
            "--tw-prose-lead": "var(--card-muted)",
            "--tw-prose-links": "var(--primary)",
            "--tw-prose-bold": "var(--primary)",
            "--tw-prose-counters": "var(--chart-2)",
            "--tw-prose-bullets": "var(--chart-4)",
            "--tw-prose-hr": "var(--accent)",
            "--tw-prose-quotes": "var(--primary)",
            "--tw-prose-quote-borders": "var(--accent)",
            "--tw-prose-captions": "var(--secondary)",
            "--tw-prose-code": "var(--primary)",
            "--tw-prose-pre-code": "var(--card-foreground)",
            "--tw-prose-pre-bg": "var(--primary)",
            "--tw-prose-th-borders": "var(--accent)",
            "--tw-prose-td-borders": "var(--muted-foreground)",
            "--tw-prose-invert-body": "var(--muted-foreground)",
            "--tw-prose-invert-headings": "var(--color-white)",
            "--tw-prose-invert-lead": "var(--accent)",
            "--tw-prose-invert-links": "var(--color-white)",
            "--tw-prose-invert-bold": "var(--color-white)",
            "--tw-prose-invert-counters": "var(--chart-4)",
            "--tw-prose-invert-bullets": "var(--chart-2)",
            "--tw-prose-invert-hr": "var(--secondary)",
            "--tw-prose-invert-quotes": "var(--card-foreground)",
            "--tw-prose-invert-quote-borders": "var(--secondary)",
            "--tw-prose-invert-captions": "var(--chart-4)",
            "--tw-prose-invert-code": "var(--color-white)",
            "--tw-prose-invert-pre-code": "var(--accent)",
            "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
            "--tw-prose-invert-th-borders": "var(--chart-2)",
            "--tw-prose-invert-td-borders": "var(--secondary)",
          },
        },
      }),
    },
  },
};
