# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --silent
COPY frontend/ .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine AS production
WORKDIR /app

# Install runtime dependencies for network scanning
RUN apk add --no-cache arp-scan nmap iproute2

# Install build dependencies for native modules (sqlite3, bcrypt)
RUN apk add --no-cache python3 make g++

# Copy backend package files and install production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --silent && apk del python3 make g++

# Copy backend source
COPY server.js ./
COPY controllers/ ./controllers/
COPY database/ ./database/
COPY discovery/ ./discovery/
COPY models/ ./models/
COPY repositories/ ./repositories/
COPY routes/ ./routes/
COPY services/ ./services/
COPY sockets/ ./sockets/
COPY utils/ ./utils/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Run migration script then start server
CMD ["sh", "-c", "node database/migrate.js && node server.js"]
