# Viber Hub — REST API Reference

Base Path: `/api/v1`

All responses follow standard envelopes:
```json
// Success
{
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 25, "timestamp": "2026-11-16T21:00:00Z" }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [ ... ]
  }
}
```

## Route Endpoints

### Authentication (`/auth`)
- `POST /auth/login`: Authenticate and establish session cookie / JWT token
- `POST /auth/register`: Create user and primary workspace
- `POST /auth/logout`: Revoke session
- `GET /auth/me`: Current user details and workspace memberships
- `POST /auth/forgot-password`: Password reset request
- `POST /auth/reset-password`: Complete password reset

### Contacts (`/contacts`)
- `GET /contacts`: List contacts (supports `search`, `tagId`, `consentStatus`, `archived`, `page`, `limit`)
- `POST /contacts`: Create contact (enforces E.164 normalization & duplicate check)
- `GET /contacts/:id`: Contact details, tags, and consent history
- `PATCH /contacts/:id`: Update contact fields
- `DELETE /contacts/:id`: Archive contact
- `POST /contacts/import`: Upload and process CSV contacts with column mapping and duplicate policy
- `GET /contacts/export`: Export authorized contact data as CSV
- `POST /contacts/:id/consent`: Record consent or opt-out withdrawal

### Destinations (`/destinations`)
- `GET /destinations`: List destinations (filter by `type`: `INDIVIDUAL`, `GROUP`, `COMMUNITY`, `CHANNEL`)
- `POST /destinations`: Add curated destination
- `GET /destinations/:id`: Destination detail
- `PATCH /destinations/:id`: Update destination
- `DELETE /destinations/:id`: Deactivate destination

### Templates (`/templates`)
- `GET /templates`: List message templates
- `POST /templates`: Create template
- `POST /templates/preview`: Render variables (`{{name}}`, `{{phone}}`, `{{company}}`, `{{date}}`) with live warnings
- `GET /templates/:id`: Template detail
- `PATCH /templates/:id`: Update template
- `DELETE /templates/:id`: Archive template

### Media (`/attachments`)
- `GET /attachments`: List private attachments
- `POST /attachments/upload`: Multipart upload (max 20MB, validates MIME and file signature)
- `GET /attachments/:id/download`: Authenticated file stream
- `DELETE /attachments/:id`: Delete attachment

### Campaigns (`/campaigns`)
- `GET /campaigns`: List campaigns by status
- `POST /campaigns`: Create campaign with items
- `GET /campaigns/:id`: Campaign detail, workflow state, items, approvals
- `POST /campaigns/:id/submit-review`: Submit campaign for designated review
- `POST /campaigns/:id/approve`: Approve or request revisions with notes
- `POST /campaigns/:id/items/:itemId/mark-completed`: Record operator-confirmed manual send with note
- `POST /campaigns/:id/archive`: Archive campaign

### Planner (`/planner`)
- `GET /planner`: List scheduled tasks by due date

### Reports (`/reports`)
- `GET /reports/overview`: Overview KPIs and operator completion counts
- `GET /reports/campaigns`: Campaign breakdown report
- `GET /reports/export`: CSV export

### Activity & Audit (`/activity`)
- `GET /activity`: List activity feed or security audit logs (`?type=audit`)
