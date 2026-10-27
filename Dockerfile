# Small official Node image
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production

# Copy package files first so "npm ci" is cached unless dependencies change
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

# Don't run as root
USER node

EXPOSE 3000
CMD ["node", "src/server.js"]
