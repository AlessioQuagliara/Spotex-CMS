# =============================================================================
# Multi-stage Dockerfile for Next.js Admin Dashboard
# Optimized for production with caching and security
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies (Base)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps
LABEL maintainer="Spotex DevOps <devops@spotex.com>"
LABEL description="Spotex CMS Admin Dashboard - Dependencies"

# Install security updates
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files for better layer caching
COPY admin/package.json admin/package-lock.json ./

# Install dependencies with frozen lockfile
RUN npm ci --legacy-peer-deps --only=production && \
    npm cache clean --force

# -----------------------------------------------------------------------------
# Stage 2: Builder
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy package files
COPY admin/package*.json ./

# Copy shared modules
COPY shared /app/shared

# Copy source code
COPY admin/. /app

# Install dev dependencies for build
RUN npm ci --legacy-peer-deps && \
    npm cache clean --force

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build application with optimizations
RUN npm run build && \
    # Remove unnecessary files
    rm -rf .next/cache

# -----------------------------------------------------------------------------
# Stage 3: Runner (Production)
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling and curl for healthcheck
RUN apk add --no-cache dumb-init curl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create health check endpoint file
RUN echo '{"status":"ok","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > /app/public/health.json

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/health.json || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "server.js"]

# -----------------------------------------------------------------------------
# Stage 4: Development
# -----------------------------------------------------------------------------
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
RUN apk add --no-cache libc6-compat git curl

# Copy package files
COPY admin/package*.json ./

# Install all dependencies (including dev)
RUN npm ci --legacy-peer-deps

# Copy shared modules
COPY shared /app/shared

# Copy source code
COPY admin/. /app

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start development server
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build Arguments and Labels
# -----------------------------------------------------------------------------
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.created=$BUILD_DATE
LABEL org.opencontainers.image.url="https://spotex.com"
LABEL org.opencontainers.image.source="https://github.com/spotex/cms"
LABEL org.opencontainers.image.version=$VERSION
LABEL org.opencontainers.image.revision=$VCS_REF
LABEL org.opencontainers.image.vendor="Spotex SRL"
LABEL org.opencontainers.image.title="Spotex CMS Admin"
LABEL org.opencontainers.image.description="Admin dashboard for Spotex CMS"
LABEL org.opencontainers.image.licenses="MIT"