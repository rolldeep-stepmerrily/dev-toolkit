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

# Verify build output
RUN test -f /app/apps/api/dist/main.js || (echo "ERROR: dist/main.js not found" && ls -la /app/apps/api/ && exit 1)

EXPOSE 3001
CMD ["node", "/app/apps/api/dist/main.js"]
