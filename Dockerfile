# ==============================================================================
# Pixbe CRM - Production Multi-Stage Dockerfile
# Stage 1: Build Frontend (Vite) & Backend (esbuild bundle)
# Stage 2: Minimal, secure Alpine runtime with healthcheck
# ==============================================================================

# --- Stage 1: Builder ---
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for potential build tools
RUN apk add --no-cache libc6-compat

# Copy package manifests
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies for build)
RUN npm ci || npm install

# Copy source code and configuration files
COPY tsconfig.json vite.config.ts index.html server.ts ./
COPY public ./public
COPY src ./src
COPY server ./server

# Build the Vite SPA and compile server.ts into dist/server.cjs
RUN npm run build:docker

# --- Stage 2: Production Runner ---
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080

# Create application data directory for multi-tenant persistent storage
RUN mkdir -p /app/.data && chown -R node:node /app

# Copy built application distribution from builder
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/package.json ./package.json

# Copy optional runtime configurations if present
COPY --from=builder --chown=node:node /app/tsconfig.json ./tsconfig.json

# Use non-root node user for security
USER node

# Expose HTTP service port
EXPOSE 8080

# Health check using native BusyBox wget
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/api/health || exit 1

# Start the bundled Express server
CMD ["node", "dist/server.cjs"]
