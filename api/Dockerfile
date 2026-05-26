FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
# Include schema for migrations
COPY src/db/schema.sql ./dist/db/schema.sql
EXPOSE 3000
USER node
CMD ["node", "dist/server.js"]
