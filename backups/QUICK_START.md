# Quick Backup Instructions - Prisma Studio

## ✅ Prisma Studio is Running!

**URL:** http://localhost:51212

## How to Backup Your Data

### Step 1: Open Prisma Studio
- Click the link above or open your browser to: http://localhost:51212
- You should see all your database tables

### Step 2: Export Each Table

For each table, follow these steps:

#### Tables to Export:
1. **users** - Admin users
2. **categories** - Movie categories  
3. **movies** - All movies (MOST IMPORTANT)
4. **trending_movies** - Trending movie links
5. **settings** - Site settings
6. **static_pages** - Static pages

#### Export Process:
1. Click on table name (e.g., "movies")
2. You'll see all records in that table
3. Look for export/download option (usually top-right)
4. Save as JSON or CSV to `backups/` folder
5. Repeat for all 6 tables

### Step 3: Verify Backups

Check that you have these files in `backups/` folder:
```
backups/
├── users.json (or .csv)
├── categories.json
├── movies.json          ← MOST IMPORTANT
├── trending_movies.json
├── settings.json
└── static_pages.json
```

---

## Alternative: Quick SQL Backup (Recommended)

If you have access to your Supabase dashboard:

1. **Go to:** https://app.supabase.com
2. **Select your project**
3. **Navigate to:** Database → Backups
4. **Click:** "Create Backup" or download existing backup
5. **Save the backup file** to `backups/` folder

This is the **easiest and most reliable** method!

---

## Alternative: Command Line Backup

If you have PostgreSQL tools installed, run:

```powershell
# Windows PowerShell
.\scripts\backup-database-sql.ps1
```

This will create a complete SQL dump in `backups/` folder.

---

## What If I Don't Have Database Access?

If you're working on a local copy without database access:

1. **Check if backup already exists** in `backups/` or `db-migrate/` folder
2. **Contact the person who deployed** the production site
3. **Ask for Supabase access** to download backup from dashboard

---

## After Backup

Once you have backups:

1. ✅ Verify files exist and have reasonable size (not 0 bytes)
2. ✅ Copy backups to cloud storage (Google Drive, etc.)
3. ✅ Keep multiple copies (local + cloud)
4. ✅ You're ready to proceed with migration!

---

## Need Help?

- **Prisma Studio not loading?** Check if DATABASE_URL is correct in `.env`
- **Can't export from Prisma Studio?** Try the Supabase dashboard method
- **No database access?** Contact the database administrator

---

**To stop Prisma Studio:** Press `Ctrl+C` in the terminal

**Created:** 2024-12-24
