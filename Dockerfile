
# Multi-stage build for production optimization
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then \
    echo "Using Yarn..." && yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then \
    echo "Using npm..." && npm ci --legacy-peer-deps; \
  elif [ -f pnpm-lock.yaml ]; then \
    echo "Using pnpm..." && yarn global add pnpm && pnpm i --frozen-lockfile; \
  else \
    echo "No lockfile found. Generating one with npm..." && \
    npm install --package-lock-only --legacy-peer-deps && \
    npm ci --legacy-peer-deps; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Create uploads directory and set permissions
RUN mkdir -p uploads/kyc uploads/profile uploads/epk && \
    chmod -R 755 uploads

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files (use Docker-optimized config)
COPY --from=builder /app/next.config.docker.js ./next.config.js
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create and set permissions for uploads directory
RUN mkdir -p /app/uploads/kyc /app/uploads/profile /app/uploads/epk && \
    chown -R nextjs:nodejs /app/uploads && \
    chmod -R 755 /app/uploads

# Copy Prisma client from builder
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["node", "server.js"]
