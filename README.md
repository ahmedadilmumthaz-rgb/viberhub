# Viber Hub

> A self-hosted communication workspace for organizing contacts, preparing content, managing approvals, and coordinating operator-led communication through supported Viber interfaces.

---

## Key Features

- **Platform Compliance**: Strict operator-led architecture adhering to Viber's Fair Usage Policy. Zero unofficial reverse-engineered API calls or account scraping.
- **Operator Handoff Checklist**: 1-click clipboard text copy, authenticated attachment downloads, verified recipient & consent checks, and explicit manual completion logging.
- **Contact Management & CSV Import/Export**: E.164 phone normalization, duplicate detection, multi-tag categorization, and full consent audit history.
- **Curated Destination Directory**: Directory of individual contacts, Viber groups, communities, and broadcast channels.
- **Message Composer & Templates**: Dynamic variable interpolation with strict allowlist (`{{name}}`, `{{phone}}`, `{{company}}`, `{{date}}`) and live missing-variable warnings.
- **Private Media Library**: Secure object storage (MinIO/S3) with MIME validation, signature verification, size limits, and authenticated streaming downloads.
- **Review & Governance Workflow**: Multi-role state machine (`DRAFT` → `IN_REVIEW` → `APPROVED` → `COMPLETED_MANUALLY`).
- **Activity & Security Audit**: Tamper-resistant audit logs for all security-sensitive actions and campaign transitions.
- **Self-Hosted Infrastructure**: Complete Docker Compose setup with Nginx reverse proxy, PostgreSQL, Redis, and automated backups.

---

## Architecture

Viber Hub is structured as an npm workspaces monorepo:

- **`apps/web`**: Next.js 14 App Router, Tailwind CSS, Lucide icons modern SaaS interface.
- **`apps/api`**: Express + TypeScript REST API (`/api/v1`) with workspace isolation, RBAC, and rate limiting.
- **`packages/shared`**: Shared TypeScript types, enums, interfaces, and utilities.
- **`packages/validation`**: Authoritative Zod validation schemas.
- **`prisma/`**: PostgreSQL schema with UUID keys, indexes, and relations.
- **`infrastructure/`**: Production Docker Compose, Nginx reverse proxy, and backup routines.

---

## Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Test Suites
```bash
npm test
```
Executes all unit, integration, and security test suites.

### 3. Build All Packages
```bash
npm run build
```

### 4. Start Development Servers
```bash
# Option A: One-step interactive launcher
./scripts/dev.sh

# Option B: Root npm dev script
npm run dev

# Option C: In two separate terminals
npm run dev:api   # API service (port 4000)
npm run dev:web   # Web dashboard (port 3000)
```

Access the dashboard at `http://localhost:3000`. Default seeded workspace accounts:
- **Administrator**: `admin@viberhub.internal` / `AdminSecretPass123!`
- **Reviewer**: `reviewer@viberhub.internal` / `ReviewerPass123!`
- **Operator**: `operator@viberhub.internal` / `OperatorPass123!`

---

## Production Deployment

Refer to [`docs/deployment.md`](docs/deployment.md) for full VPS deployment instructions using Docker Compose and Nginx.
