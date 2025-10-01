# Base image with Node.js 20
FROM node:20-alpine AS base

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Update npm to the latest version
RUN npm install -g npm@11.6.1

# Install pnpm globally
RUN npm install -g pnpm

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install dependencies
FROM base AS deps
# Step 1: Install dependencies based on lockfile
RUN if [ -f pnpm-lock.yaml ]; then \
      echo "Using pnpm..." && pnpm install --frozen-lockfile; \
    elif [ -f yarn.lock ]; then \
      echo "Using Yarn..." && yarn install --frozen-lockfile; \
    elif [ -f package-lock.json ]; then \
      echo "Using npm ci..." && npm ci --legacy-peer-deps; \
    else \
      echo "No lockfile found. Using npm install..." && npm install --legacy-peer-deps; \
    fi

# Step 2: Handle peer dependencies
RUN npm install --legacy-peer-deps

# Development stage
FROM base AS development
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy application code
COPY . .

# Create .next directory and set permissions
RUN mkdir -p /app/.next && \
    chown -R node:node /app && \
    chmod -R 775 /app

# Switch to non-root user
USER node

# Set environment variables
ENV NODE_ENV=development
ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true

# Expose port
EXPOSE 3000

# Development command
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS builder
WORKDIR /app

# Copy node_modules and application code
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the Next.js application
RUN pnpm build

# Production stage
FROM base AS production
WORKDIR /app

# Copy necessary files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Create .next directory and set permissions
RUN mkdir -p /app/.next && \
    chown -R node:node /app && \
    chmod -R 775 /app

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER node

# Expose port
EXPOSE 3000

# Set the command to run the application
CMD ["node", "server.js"]