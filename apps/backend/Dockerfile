# ==============================================================================
# Stage 1 -- Install dependencies
# ==============================================================================
FROM node:22-alpine AS deps

WORKDIR /app

# Copy workspace root manifests first (for npm workspaces resolution).
COPY package.json package-lock.json* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install production + dev dependencies (dev deps are needed for the build step).
RUN npm ci --ignore-scripts

# ==============================================================================
# Stage 2 -- Build TypeScript
# ==============================================================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy everything from the deps stage (node_modules).
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules 2>/dev/null || true
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules 2>/dev/null || true

# Copy source files.
COPY package.json tsconfig.base.json ./
COPY apps/backend/ ./apps/backend/
COPY packages/shared/ ./packages/shared/

# Build the shared package first, then the backend.
WORKDIR /app/packages/shared
RUN npx tsc --noEmit || true

WORKDIR /app/apps/backend
RUN npx tsc

# ==============================================================================
# Stage 3 -- Production image
# ==============================================================================
FROM node:22-alpine AS production

LABEL org.opencontainers.image.source="https://github.com/blockjam/blockjam-creator"
LABEL org.opencontainers.image.description="BlockJam Creator API server"

# Create a non-root user for security.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy the compiled output and production node_modules.
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules 2>/dev/null || true
COPY apps/backend/package.json ./package.json

# Copy shared package artifacts (types that may be referenced at runtime).
COPY --from=builder /app/packages/shared ./packages/shared

# Switch to non-root user.
USER appuser

# Expose the API port.
EXPOSE 3000

# Healthcheck -- hit a lightweight endpoint every 30 s.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Start the server.
CMD ["node", "dist/server.js"]
