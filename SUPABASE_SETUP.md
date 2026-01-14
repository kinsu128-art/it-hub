# Supabase Setup Guide

This application uses Supabase PostgreSQL for data storage.

## Setup Steps

### 1. Get Your Database Password

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl/settings/database)
2. Navigate to **Settings** > **Database**
3. Under **Connection string**, click **Show** to reveal your database password
4. Copy the password

### 2. Update Environment Variables

Open `.env.local` and replace `[YOUR-PASSWORD]` with your actual database password:

```env
DATABASE_URL=postgresql://postgres.sapzbrueaipnbbazsvcl:YOUR_ACTUAL_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### 3. Initialize the Database

The database schema is already created. You just need to create the default admin user:

```bash
npm run db:init
```

This will create:
- Username: `admin`
- Password: `admin123`

### 4. Start the Application

```bash
npm run dev
```

Visit http://localhost:3000 and login with the admin credentials.

## Database Information

- **Project URL**: https://sapzbrueaipnbbazsvcl.supabase.co
- **Region**: ap-south-1 (Mumbai)
- **Dashboard**: https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl

## Database Tables

The following tables are created:

- `users` - User accounts with roles
- `pcs` - PC/Laptop asset management
- `servers` - Server asset management
- `network_ips` - Network IP address management
- `printers` - Printer asset management
- `software` - Software license management
- `asset_history` - Audit log for all changes

## Migrations

The initial schema migration (`initial_schema`) has been applied. All tables, indexes, and constraints are set up.

## Troubleshooting

### Connection Issues

If you see "DATABASE_URL is not configured" warning:
1. Verify you've updated `.env.local` with the correct password
2. Restart the development server
3. Check your Supabase project is active

### Admin User Already Exists

If `npm run db:init` shows "Admin user already exists", the database is already set up. You can skip this step.

### Password Reset

To reset the admin password:
1. Delete the user from Supabase dashboard
2. Run `npm run db:init` again

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Project Dashboard](https://supabase.com/dashboard/project/sapzbrueaipnbbazsvcl)
