# syntax=docker/dockerfile:1

FROM node:23-alpine AS build
WORKDIR /app

ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV NUXT_APP_BASE_URL=/
ENV NUXT_PUBLIC_API_BASE=

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm generate

FROM node:23-alpine AS runtime
WORKDIR /app

ENV TELECAT_DB_PATH=/app/data/sb.sqlite
ENV TELECAT_PORT=4000
ENV NODE_ENV=production

RUN apk add --no-cache nginx

COPY nginx.conf /etc/nginx/http.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
COPY --from=build /app/server ./server
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

RUN mkdir -p /app/data /run/nginx

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

CMD ["/docker-entrypoint.sh"]
