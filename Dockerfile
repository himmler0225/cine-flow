FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile
COPY . .
ARG VITE_MOVIE_API_URL
ARG VITE_SITE_URL
ARG VITE_SENTRY_DSN=""
ENV VITE_MOVIE_API_URL=${VITE_MOVIE_API_URL} \
    VITE_SITE_URL=${VITE_SITE_URL} \
    VITE_SENTRY_DSN=${VITE_SENTRY_DSN} \
    NITRO_PRESET=node-server
RUN yarn build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
COPY --from=builder /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
