# ==========================================
# SkillSwap Production Multi-Stage Dockerfile
# Optimized for Google Cloud Run, AWS, or Docker hosts
# ==========================================

FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json package-lock.json* bun.lock* ./

# Install dependencies
RUN npm ci || npm install

# Copy application source code
COPY . .

# Build production frontend assets into /dist
RUN npm run build

# ==========================================
# Production Runtime Stage
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV MAX_UPLOAD_SIZE_BYTES=2147483648

# Copy build artifacts and dependencies from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/src/data ./src/data
COPY --from=builder /app/uploads ./uploads

# Ensure upload directories exist with proper write permissions
RUN mkdir -p /app/uploads/data /app/uploads/videos && chmod -R 777 /app/uploads

# Expose port (Cloud Run sets PORT=8080 by default; server reads process.env.PORT)
EXPOSE 3000

# Start production server
CMD ["node", "--loader", "tsx", "server.ts"]
