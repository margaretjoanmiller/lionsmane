FROM node:24-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app

FROM base AS prod-deps
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM base AS build
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build --filter=lionsmaneapi

FROM node:24-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./

COPY --from=build /app/lionsmaneapi/dist ./dist

USER node

EXPOSE 4000

CMD ["node", "dist/index.mjs"]
