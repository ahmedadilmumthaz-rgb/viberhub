# Viber Hub — Security & Compliance Architecture

## Authentication & Authorization
- **Password Protection**: Passwords are hashed using Argon2id/bcrypt with 10+ rounds.
- **Session Handling**: Browser sessions use secure, HTTP-only, SameSite cookies.
- **Server-Side RBAC**: Every request verifies membership and role:
  - `OWNER`: Full workspace control, user administration, data deletion.
  - `ADMINISTRATOR`: Workspace configuration, exports, templates, campaigns.
  - `EDITOR`: Create contacts, drafts, media, and submit campaigns for review.
  - `REVIEWER`: Designated reviewer with approval/rejection authority.
  - `VIEWER`: Read-only access to permitted records.
- **Multi-Tenant Workspace Scoping**: Cross-tenant data access is blocked server-side. Unmatched workspace queries return non-disclosing 404 responses.

## File Security
- **MIME & Extension Whitelist**: Only images (JPG, PNG, WebP, GIF), PDFs, and common documents (DOC, DOCX, XLS, XLSX, TXT, CSV) are permitted.
- **Executable Blocking**: Scripts and executables (`.exe`, `.sh`, `.bat`, `.cmd`, `.js`, `.py`, `.php`) are rejected immediately.
- **Private Storage**: Objects are saved with random UUID keys in private buckets. Permanent public URLs are prohibited. Downloads require authenticated API tokens.

## Privacy & Consent Governance
- Consent records preserve provenance: status (`GRANTED`, `WITHDRAWN`, `UNKNOWN`), purpose, source, evidence reference, operator, and timestamp.
- Opt-outs (`WITHDRAWN`) trigger prominent warnings across contact profiles and campaign handoff checklists.
- Audit logs capture all data exports and security events with IP address and user-agent.
