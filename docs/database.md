# Viber Hub — Database Specification

## Schema Design Principles
1. **UUID Primary Keys**: All entities use UUID v4 primary keys.
2. **Workspace Scoping**: Every workspace-owned record has a `workspaceId` foreign key with composite unique constraints and database indexes.
3. **Immutability & Audit**: Audit logs, activity logs, approval records, and consent history records are append-only.
4. **Soft Deletion**: Contacts, message templates, destinations, and campaigns support soft deletion via `archivedAt` timestamps to preserve auditability.

## Entity Relationships
- `User` 1:N `WorkspaceMember` N:1 `Workspace`
- `Workspace` 1:N `Contact` 1:N `ConsentRecord`
- `Contact` M:N `Tag` (via `ContactTag`)
- `Workspace` 1:N `Destination` 0:1 `Contact`
- `Workspace` 1:N `MessageTemplate`
- `Workspace` 1:N `Campaign` 1:N `CampaignItem`
- `CampaignItem` M:N `Attachment` (via `CampaignAttachment`)
- `Campaign` 1:N `ApprovalRecord`
- `Workspace` 1:N `ActivityLog` & `AuditLog`
- `Workspace` 1:N `ImportBatch`
- `Workspace` 1:N `ViberAccount` (Metadata label only)
- `Workspace` 1:N `Device` (Companion registry)

## Phone Indexing & Invariants
```sql
CREATE UNIQUE INDEX "contacts_workspaceId_phoneE164_key" 
ON "contacts"("workspaceId", "phoneE164");
```
Ensures no duplicate phone numbers exist within the same organization while allowing distinct workspaces to operate independently.
