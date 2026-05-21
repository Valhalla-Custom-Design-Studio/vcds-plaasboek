# Plaasboek™ API — Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY api/package.json ./
RUN npm install --production

# Copy source
COPY api/ ./api/
COPY database/ ./database/
COPY .env.production .env

EXPOSE 3000

# Run migrations then start
CMD ["sh", "-c", "node database/migrate.js && node api/server.js"]
