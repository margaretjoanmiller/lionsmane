FROM node:24 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run --filter=lionsmane-be -r build
RUN pnpm deploy --filter=lionsmane-be --prod /prod/lionsmane-be

FROM base AS lionsmane-be
COPY --from=build /prod/lionsmane-be /prod/lionsmane-be
WORKDIR /prod/lionsmane-be
EXPOSE 8181
HEALTHCHECK --interval=5m --timeout=3s \
  CMD curl -f http://localhost:8181/health || exit 1
CMD [ "node", "dist/main.js" ]
