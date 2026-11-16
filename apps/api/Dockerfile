FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

RUN npm install

COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation
COPY apps/api ./apps/api

RUN npm run build --workspace=@viberhub/shared
RUN npm run build --workspace=@viberhub/validation
RUN npm run build --workspace=@viberhub/api

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/api/package*.json ./apps/api/
COPY prisma ./prisma/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/validation/dist ./packages/validation/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000

CMD ["node", "apps/api/dist/server.js"]
