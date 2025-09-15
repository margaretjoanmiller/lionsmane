FROM node:24 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
COPY . /usr/src/app
WORKDIR /usr/src/app
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run -r build
RUN pnpm deploy --filter=lionsmane-be --prod /prod/lionsmane-fe

FROM caddy:2.10.2-alpine AS lionsmane-fe

COPY --from=build /usr/src/app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile
