FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --omit=dev
RUN npx prisma generate

# Copy collab server and config
COPY server ./server/
COPY tsconfig.json ./

# Install tsx for TypeScript runtime
RUN npm install -g tsx

EXPOSE 3002

CMD ["tsx", "server/collaboration.ts"]
