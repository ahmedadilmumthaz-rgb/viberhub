# Viber Hub — Production VPS Deployment Guide

## Prerequisites
- Linux VPS (Ubuntu 22.04 LTS or 24.04 LTS recommended)
- 2+ CPU cores, 4GB+ RAM, 50GB+ SSD storage
- Docker Engine & Docker Compose plugin installed
- Domain DNS (A record) pointing to your VPS public IP

## Step-by-Step Deployment

### 1. Clone & Configure Environment
```bash
git clone <repository_url> viberhub
cd viberhub
cp .env.example .env
```
Generate strong random secrets for `SESSION_SECRET`, `CSRF_SECRET`, and database credentials in `.env`.

### 2. Launch Services with Docker Compose
```bash
cd infrastructure
docker compose up -d
```
This initializes:
- `viberhub-nginx`: Reverse proxy on ports 80/443
- `viberhub-web`: Next.js web application
- `viberhub-api`: Express REST API
- `viberhub-postgres`: PostgreSQL database (private Docker network)
- `viberhub-redis`: Redis cache (private Docker network)
- `viberhub-minio`: S3-compatible private object store (private Docker network)

### 3. Initialize Database Migrations & Seeds
```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx ts-node prisma/seed.ts
```

### 4. Verify Service Health
```bash
curl -f http://localhost/healthz
curl -f http://localhost/readyz
```

### 5. Automated Rolling Backups
Configure a cron job on your host machine to run the automated backup routine daily:
```bash
0 3 * * * /path/to/viberhub/infrastructure/backups/backup.sh >> /var/log/viberhub_backups.log 2>&1
```
