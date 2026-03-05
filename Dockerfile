FROM node:22-slim

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
CMD ["sh", "-c", "pnpm --filter @repo/api exec prisma migrate deploy && node /app/apps/api/dist/src/main.js"]
