# ==============================================================================
# BUKAR DATA SUB — ENTERPRISE MULTI-STAGE DOCKERFILE
# ==============================================================================
# Stage 1: Build the Modern React + Vite Frontend
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Build and Run Production Node.js Server
FROM node:22-alpine AS production-runner
WORKDIR /app

# Install native dependencies required for SQLite and crypto
RUN apk add --no-cache python3 make g++

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Copy backend dependencies and install
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev

# Copy backend source code
COPY backend/ ./backend/

# Copy built frontend assets from stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy root package.json
COPY package*.json ./

# Ensure persistent SQLite data and backup directories exist
RUN mkdir -p /app/backend/data /app/backend/data/backups /app/logs

# Volume for persistent SQLite database and backups
VOLUME ["/app/backend/data", "/app/logs"]

# Expose unified application port (SPA + API)
EXPOSE 5000

# Start Bukar Data Sub Authoritative Server
CMD ["node", "--import", "tsx", "backend/src/server.ts"]
