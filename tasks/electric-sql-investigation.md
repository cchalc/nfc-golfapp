# Electric SQL Architecture Investigation Plan

## Objective
Understand why Electric SQL wasn't working properly and determine the correct architecture for local-first sync with PostgreSQL.

## Background
The previous implementation used:
- Electric SQL Cloud for sync
- TanStack DB with Electric collections
- Neon PostgreSQL with logical replication enabled
- Proxy routes forwarding shapes from Electric Cloud

**Symptoms that led to removal:**
- [ ] Document specific errors/issues encountered
- [ ] Was data syncing at all?
- [ ] Were there connection issues to Electric Cloud?
- [ ] Was logical replication properly configured on Neon?

---

## Phase 1: Research Electric SQL Architecture

### 1.1 Official Documentation Review
- [ ] Read Electric SQL getting started: https://electric-sql.com/docs/quickstart
- [ ] Review Electric SQL Cloud setup: https://electric-sql.com/docs/guides/deployment
- [ ] Study Shape API: https://electric-sql.com/docs/api/http
- [ ] Understand sync protocol: https://electric-sql.com/docs/reference/protocol

### 1.2 TanStack Integration
- [ ] Review @tanstack/electric-db-collection docs
- [ ] Review @tanstack/db collection setup
- [ ] Understand how shapes map to collections
- [ ] Check version compatibility requirements

### 1.3 Neon PostgreSQL Requirements
- [ ] Logical replication setup guide
- [ ] Required PostgreSQL settings (wal_level, etc.)
- [ ] Connection string requirements (pooled vs direct)
- [ ] REPLICA IDENTITY requirements for tables

---

## Phase 2: Diagnose Previous Issues

### 2.1 Electric Cloud Configuration
- [ ] Verify source was properly configured
- [ ] Check if database connection was valid
- [ ] Review Electric Cloud dashboard for errors
- [ ] Verify ELECTRIC_SECRET token was valid

### 2.2 Database Schema Requirements
- [ ] Check if REPLICA IDENTITY FULL was set on all synced tables
- [ ] Verify logical replication slot was created
- [ ] Check publication settings
- [ ] Review any schema migration issues

### 2.3 Client-Side Integration
- [ ] Review proxy route implementation
- [ ] Check shape URL construction
- [ ] Verify collection options configuration
- [ ] Review error handling and retry logic

---

## Phase 3: Build Minimal Working Example

### 3.1 Create Test Project
- [ ] New minimal TanStack Start project
- [ ] Single table (e.g., `todos`)
- [ ] Electric Cloud source connected to Neon
- [ ] Basic CRUD operations

### 3.2 Verify Each Layer
1. **Database**: Confirm logical replication works
2. **Electric Cloud**: Confirm shapes are being served
3. **Proxy Route**: Confirm shapes are forwarded correctly
4. **Client Collection**: Confirm data syncs to browser

### 3.3 Document Working Configuration
- [ ] Exact package versions
- [ ] Database schema with required settings
- [ ] Electric Cloud configuration
- [ ] Client-side collection setup
- [ ] Environment variables needed

---

## Phase 4: Architecture Decision

### 4.1 Evaluate Options

| Option | Pros | Cons |
|--------|------|------|
| **Electric SQL** | Real-time sync, offline-first, conflict resolution | Complexity, external dependency, debugging difficulty |
| **TanStack Query** | Simple, well-documented, easy debugging | No offline support, no real-time sync |
| **Supabase Realtime** | Built-in to Supabase, simpler setup | Requires Supabase, no offline |
| **Custom WebSocket** | Full control, no dependencies | Significant implementation effort |

### 4.2 Questions to Answer
- Does this app need real-time sync between devices?
- Does this app need offline support?
- How critical is conflict resolution?
- What's the acceptable complexity budget?

### 4.3 Recommendation
Based on investigation, recommend:
- [ ] Return to Electric SQL with fixes
- [ ] Stay with TanStack Query (current)
- [ ] Hybrid approach (Query + selective real-time)
- [ ] Different sync solution

---

## Phase 5: Implementation (if returning to Electric)

### 5.1 Prerequisites Checklist
- [ ] Neon logical replication enabled
- [ ] All tables have REPLICA IDENTITY FULL
- [ ] Electric Cloud source created and connected
- [ ] Direct (non-pooled) connection string configured
- [ ] Publication created for all tables

### 5.2 Migration Plan
- [ ] Add Electric packages back
- [ ] Create proxy routes (one per table)
- [ ] Create Electric collections
- [ ] Replace TanStack Query hooks with useLiveQuery
- [ ] Add offline transaction support
- [ ] Test sync in both directions

---

## Resources

- Electric SQL Docs: https://electric-sql.com/docs
- TanStack DB: https://tanstack.com/db/latest
- Neon Logical Replication: https://neon.tech/docs/guides/logical-replication-guide
- Electric SQL Discord: https://discord.gg/electric-sql

## Notes

_Add investigation notes here as you progress_

