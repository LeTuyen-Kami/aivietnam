FROM oven/bun:1 AS builder

WORKDIR /app

COPY package.json bun.lock ./
COPY patches ./patches

RUN bun install --frozen-lockfile

COPY . .

ARG PAYLOAD_SECRET
ENV PAYLOAD_SECRET=$PAYLOAD_SECRET

RUN bun run build


FROM oven/bun:1 AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone ./

EXPOSE 3000

CMD ["node", "server.js"]