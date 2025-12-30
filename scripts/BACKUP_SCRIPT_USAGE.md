# Database Backup Script - Usage Guide

## ✅ Automated Backup Script Created!

I've created a comprehensive Node.js backup script that will export **everything** from your database:
- ✅ Complete database schema
- ✅ All data from all tables
- ✅ Automatic compression
- ✅ Detailed backup report

---

## How to Run the Backup

### Method 1: Using npm (Recommended)

```bash
npm run backup
```

or

```bash
npm run backup:db
```

### Method 2: Direct execution

```bash
npx tsx scripts/backup-database.ts
```

---

## What the Script Does

The script automatically:

1. **Checks for pg_dump** (PostgreSQL backup tool)
   - If found: Creates a compressed SQL dump (`.sql.gz`)
   - If not found: Creates a JSON backup with Prisma

2. **Exports everything:**
   - All 6 tables (users, categories, movies, trending_movies, settings, static_pages)
   - All data in every table
   - Database schema structure
   - Relationships and constraints

3. **Creates backup file** in `backups/` folder:
   - SQL dump: `database-backup-YYYY-MM-DD-HH-MM-SS.sql.gz`
   - JSON backup: `database-backup-YYYY-MM-DD-HH-MM-SS.json`

4. **Shows detailed report:**
   - File location and size
   - Record counts for each table
   - Total records backed up
   - Restore instructions

---

## Requirements

### For SQL Dump (Recommended):

**Install PostgreSQL client tools:**

**Windows:**
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer, select "Command Line Tools"
3. Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**Or use Chocolatey:**
```powershell
choco install postgresql
```

### For JSON Backup (Fallback):

No additional tools needed! The script will automatically use Prisma if pg_dump is not available.

---

## Troubleshooting

### Error: "DATABASE_URL not found"

**Solution:** Make sure your `.env` file exists and contains:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Error: "Cannot connect to database"

**Solution:**
1. Check your DATABASE_URL is correct
2. Ensure database is accessible
3. Check your internet connection (if using cloud database like Supabase)

### Error: "Prisma Client initialization failed"

**Solution:** Run Prisma generate first:
```bash
npx prisma generate
npm run backup
```

### Script runs but no backup file created

**Solution:**
1. Check the `backups/` folder exists
2. Look for error messages in the output
3. Try running with verbose logging

---

## Alternative: Manual Backup Methods

If the script doesn't work, you can use these alternatives:

### Option 1: Supabase Dashboard (Easiest)
1. Go to https://app.supabase.com
2. Select your project
3. Database → Backups → Download

### Option 2: PowerShell Script
```powershell
.\scripts\backup-database-sql.ps1
```

### Option 3: Prisma Studio
1. Run: `npx prisma studio`
2. Open: http://localhost:5555
3. Export each table manually

---

## Backup File Locations

All backups are saved to:
```
d:\kailash\old_filmyfly\backups\
```

**Example files:**
```
backups/
├── database-backup-2024-12-24-10-30-00.sql.gz  ← SQL dump (compressed)
└── database-backup-2024-12-24-10-31-00.json    ← JSON backup
```

---

## Verifying Your Backup

After running the script:

```powershell
# Check backups folder
cd backups
dir

# Verify file size (should be > 1 MB)
```

**Good backup:**
- ✅ File exists in `backups/` folder
- ✅ File size is reasonable (1 MB - 100 MB)
- ✅ Filename has today's date
- ✅ Script showed "BACKUP COMPLETED SUCCESSFULLY"

---

## Restoring a Backup

### From SQL dump:

```bash
# Decompress and restore
gunzip -c backups/database-backup-2024-12-24.sql.gz | psql -h your-host -U your-user -d your-database
```

### From JSON backup:

You'll need to write a restore script in Go (for migration) or Node.js:

```typescript
// Read JSON file
const backup = JSON.parse(fs.readFileSync('backups/database-backup.json', 'utf8'));

// Insert data using Prisma
await prisma.user.createMany({ data: backup.data.users });
await prisma.category.createMany({ data: backup.data.categories });
// ... etc
```

---

## Next Steps

1. ✅ Run the backup script: `npm run backup`
2. ✅ Verify backup file exists and has good size
3. ✅ Copy backup to cloud storage (Google Drive, etc.)
4. ✅ Keep multiple copies (local + cloud)
5. ✅ Ready to proceed with migration!

---

## Support

If you encounter issues:

1. **Check DATABASE_URL** in `.env` file
2. **Try alternative methods** (Supabase Dashboard, Prisma Studio)
3. **Check error messages** carefully
4. **Ensure database is accessible**

---

**Script Location:** `scripts/backup-database.ts`  
**Created:** 2024-12-24  
**For:** FilmyFly Migration to Go Gin + Astro
