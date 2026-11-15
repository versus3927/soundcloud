# ── VERSUSCLOUD · production image (Railway / any Docker host) ──
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
# Build-time dummy value: pg Pool is lazy and never connects during `next build`.
ENV DATABASE_URL="postgresql://postgres:postgres@localhost:5432/build"
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Real DATABASE_URL is injected by Railway at runtime.
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start"]
