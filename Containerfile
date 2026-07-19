FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm run --filter=lionsmaneapi build
RUN pnpm deploy --filter=lionsmaneapi --prod /prod/api

FROM base AS api
COPY --from=build /prod/api /prod/api
WORKDIR /prod/api
EXPOSE 4000
CMD [ "node", "/prod/api/dist/index.mjs" ]
