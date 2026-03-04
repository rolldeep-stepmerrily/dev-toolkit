FROM node:22-slim AS base

RUN npm install -g pnpm@10.30.3
WORKDIR /app

# Install dependencies
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

# Build
COPY . .
RUN pnpm --filter @repo/api build

EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
