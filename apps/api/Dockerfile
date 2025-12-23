FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files from monorepo root
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies
WORKDIR /app/apps/api
RUN cd /app && pnpm install --filter=api...

# Generate Prisma client
RUN pnpm prisma generate

# Copy API source code
COPY apps/api/src ./src/
COPY apps/api/tsconfig.json ./

# Build
RUN pnpm build

EXPOSE 3333

# Default command (can be overridden for worker)
CMD ["node", "dist/server.js"]
