# Railway: force Node 24+ for Prisma
FROM node:24-bookworm-slim

WORKDIR /app

# Install deps needed for native modules (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV PORT=3000
EXPOSE 3000

CMD ["npm", "start"]
