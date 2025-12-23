FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package files
COPY package.json pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Generate Prisma client
RUN pnpm prisma generate

# Copy source code
COPY . .

# Build
RUN pnpm build

EXPOSE 3333

# Default command (can be overridden for worker)
CMD ["node", "dist/server.js"]
