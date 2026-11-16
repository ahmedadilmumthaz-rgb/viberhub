FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY packages/validation ./packages/validation
COPY apps/web ./apps/web

RUN npm run build --workspace=@viberhub/shared
RUN npm run build --workspace=@viberhub/validation
RUN npm run build --workspace=@viberhub/web

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/validation/package*.json ./packages/validation/
COPY apps/web/package*.json ./apps/web/

RUN npm install --omit=dev

COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/validation/dist ./packages/validation/dist
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["npm", "run", "start", "--workspace=@viberhub/web"]
