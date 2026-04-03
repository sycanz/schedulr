FROM node:22-bookworm-slim

# Install build dependencies (Debian/Ubuntu style)
RUN apt-get update && apt-get install -y \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY backend/cloudflare-workers/package*.json ./backend/cloudflare-workers/

RUN npm run setup

COPY . .

EXPOSE 8787

CMD ["npm", "run", "setup"]
