# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IT-Hub** - 전산실 통합 IT 인프라 관리 시스템
Next.js 14 (App Router) + Supabase PostgreSQL 기반 IT 자산 관리 애플리케이션

## Commands

### Development
```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database
```bash
npm run db:init      # Initialize database (creates tables and admin user)
```

### Default Credentials
- Username: `admin`
- Password: `admin123`

## Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Database**: Supabase PostgreSQL (cloud-hosted, production-ready)
- **Database Client**: postgres package for direct SQL queries
- **Authentication**: iron-session (cookie-based sessions)
- **State**: React hooks (no external state management)
- **Charts**: Recharts (planned for dashboard)

### Project Structure
```
app/
  (auth)/           # Authentication pages (login)
  (dashboard)/      # Protected dashboard pages
    dashboard/      # Main dashboard
    pc/            # PC asset management
    server/        # Server management (planned)
    network/       # Network IP management (planned)
    printer/       # Printer management (planned)
    software/      # Software license management (planned)
  api/             # API routes
    auth/          # Authentication endpoints
    pc/            # PC CRUD endpoints
components/
  common/          # Reusable UI components (Button, Loading, Pagination)
  forms/           # Form components (PcForm)
  layout/          # Layout components (Header, Sidebar)
lib/
  auth/            # Authentication utilities (session, password)
  db/              # Database utilities (schema, history, queries)
  utils/           # Utility functions (compare, constants)
types/             # TypeScript type definitions
```

### Database Schema
- **users**: User accounts with roles (admin/user/viewer)
- **pcs**: PC/Laptop assets
- **servers**: Server assets
- **network_ips**: IP address management
- **printers**: Printer assets
- **software**: Software licenses
- **asset_history**: Audit log for all asset changes

### Key Patterns

#### API Routes
- All API routes check authentication via `getSession()`
- CRUD operations follow REST conventions:
  - `GET /api/{resource}` - List with pagination/filtering
  - `POST /api/{resource}` - Create
  - `GET /api/{resource}/[id]` - Get details
  - `PUT /api/{resource}/[id]` - Update
  - `DELETE /api/{resource}/[id]` - Soft delete (status change to 'disposed')

#### History Tracking
- All create/update/delete operations automatically record history via `recordHistory()`
- Changes are tracked at field level for updates
- History includes: user, timestamp, old/new values

#### Authentication Flow
- Middleware (`middleware.ts`) protects dashboard routes
- Session data stored in encrypted cookies (iron-session)
- Automatic redirect to login if unauthenticated

#### Database Operations
- Use `runQuery()`, `getOne()`, `runInsert()`, `runUpdate()`, `runDelete()` helpers
- Database auto-saves after every write operation (sql.js specific)
- Transactions available via `transaction()` helper

## Current Implementation Status

✅ **Completed**:
- Project setup and configuration
- Database schema and initialization
- Authentication system (login/logout/session)
- Dashboard layout (Header, Sidebar)
- PC asset management (full CRUD)
  - List with pagination, search, filtering
  - Create, read, update, delete
  - Change history tracking
  - Status management (assigned/in_stock/repair/disposed)

⏳ **Planned** (from PRD):
- Server asset management
- Network IP management (with duplicate IP check)
- Printer asset management
- Software license management
- Dashboard statistics and charts
- Excel upload/download
- IP map visualization
- Reports and exports

## Development Notes

### Adding New Asset Types
1. Create API routes: `app/api/{asset}/route.ts` and `app/api/{asset}/[id]/route.ts`
2. Create pages: `app/(dashboard)/{asset}/page.tsx`, `new/page.tsx`, `[id]/page.tsx`, `[id]/edit/page.tsx`
3. Create form component: `components/forms/{Asset}Form.tsx`
4. Add types to `types/asset.ts`
5. Update sidebar navigation in `components/layout/Sidebar.tsx`

### Database Changes
- Schema defined in `lib/db/schema.ts`
- For new tables, add to schema and re-run `npm run db:init` (will delete existing data)
- In production, implement proper migrations instead

### sql.js Specifics
- Database is file-based but loaded entirely in memory
- Changes are persisted to file after each write
- No concurrent write safety - single-user or low-concurrency use only
- Good for development and small deployments
- For production with multiple users, consider switching to better-sqlite3 or PostgreSQL
