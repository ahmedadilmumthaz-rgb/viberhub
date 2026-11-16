# Viber Hub — Architecture & System Design

## Overview
Viber Hub is a self-hosted workspace for organizing contacts, preparing campaigns, managing designated reviews, and coordinating operator-led communication through supported Viber interfaces.

## Platform Policy & Operating Boundary
Viber Hub strictly adheres to Viber platform rules and fair-usage policies:
- **Zero Unofficial Automation**: Viber Hub never invokes undocumented Viber endpoints, extracts session cookies/tokens, or reverse-engineers private network protocols.
- **Operator-Led Handoff**: Campaigns are prepared, reviewed, and approved within Viber Hub. Once approved, a human operator uses verified handoff tools (one-click copy-to-clipboard, authenticated attachment downloads) and sends the message inside the official Viber application.
- **Verifiable Reporting**: Completion records are logged as `COMPLETED_MANUALLY` with operator attribution and ISO timestamps. Viber Hub never fabricates delivery or read receipts.

## High-Level Monorepo Structure
```
viberhub/
├── apps/
│   ├── api/                    # Express + TypeScript REST API (/api/v1)
│   └── web/                    # Next.js 14 App Router + Tailwind CSS SaaS UI
├── packages/
│   ├── shared/                 # Shared enums, DTOs, allowlists, utilities
│   └── validation/             # Authoritative Zod schemas
├── prisma/
│   ├── schema.prisma           # Relational PostgreSQL schema with UUIDs & indexes
│   └── seed.ts                 # Seeding script
├── infrastructure/
│   ├── docker-compose.yml      # Multi-container orchestration (nginx, web, api, db, redis)
│   ├── nginx/nginx.conf        # TLS termination, security headers, upload limit
│   └── backups/backup.sh       # Automated database backup script
└── docs/                       # Technical guides
```

## Modular API Domains
1. **Auth & Sessions**: Argon2id/bcrypt password hashing, HTTP-only SameSite cookies, session rotation, TOTP MFA.
2. **Workspaces & RBAC**: Strict multi-tenant workspace scoping; roles: `OWNER`, `ADMINISTRATOR`, `EDITOR`, `REVIEWER`, `VIEWER`.
3. **Contacts & Consent**: E.164 normalization, duplicate protection, consent tracking (`GRANTED`, `WITHDRAWN`, `UNKNOWN`), CSV import/export.
4. **Destinations**: Curated directory of Individuals, Groups, Communities, and Channels.
5. **Templates & Composer**: Strict variable allowlist (`{{name}}`, `{{phone}}`, `{{company}}`, `{{date}}`) with live preview and missing-variable warnings.
6. **Media Library**: Private R2 Storage (hosted on mvcdn.cc) with MIME validation, signature checks, size caps, and authenticated presigned downloads.
7. **Campaign Lifecycle**: Enforced state machine (`DRAFT -> IN_REVIEW -> APPROVED -> COMPLETED_MANUALLY`), approval audit trail, operator handoff checklist.
8. **Observability & Audit**: Structured JSON logging, tamper-resistant audit logs, `/healthz` and `/readyz` probes.
