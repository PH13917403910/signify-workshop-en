FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3100

RUN apk add --no-cache libstdc++ && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/server ./server
COPY --from=builder /app/next.config.ts ./next.config.ts

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh && \
    mkdir -p /app/data && chown nextjs:nodejs /app/data

EXPOSE 3100

CMD ["/app/docker-entrypoint.sh"]
