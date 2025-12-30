# Database Backup Scripts

This directory contains scripts to backup your FilmyFly database before migration.

## Available Backup Methods

### Method 1: JSON Backup (Recommended for Migration)

**File:** `backup-database.ts`

Creates a JSON backup of all database tables with metadata. Best for migration to Go + Astro.

**Usage:**
```bash
npm run tsx scripts/backup-database.ts
# or
npx tsx scripts/backup-database.ts
```

**Output:**
- File: `backups/database-backup-YYYY-MM-DD-HH-MM-SS.json`
- Contains: All tables (users, categories, movies, trending_movies, settings, static_pages)
- Format: JSON with metadata

**Pros:**
- ✅ Easy to parse and import into new system
- ✅ Human-readable format
- ✅ Includes all relationships
- ✅ Perfect for Go + GORM migration

**Cons:**
- ❌ Larger file size than SQL dump
- ❌ Not directly restorable to PostgreSQL

---

### Method 2: SQL Dump (Recommended for PostgreSQL Restore)

**Files:** 
- `backup-database-sql.sh` (Linux/Mac)
- `backup-database-sql.ps1` (Windows)

Creates a complete PostgreSQL SQL dump that can be directly restored.

**Usage (Windows):**
```powershell
.\scripts\backup-database-sql.ps1
```

**Usage (Linux/Mac):**
```bash
chmod +x scripts/backup-database-sql.sh
./scripts/backup-database-sql.sh
```

**Output:**
- File: `backups/database-backup-YYYY-MM-DD-HH-MM-SS.sql.gz` (compressed)
- Contains: Complete SQL dump with schema and data
- Format: PostgreSQL SQL

**Pros:**
- ✅ Complete database backup
- ✅ Can be directly restored to PostgreSQL
- ✅ Compressed (smaller file size)
- ✅ Industry standard format

**Cons:**
- ❌ Requires PostgreSQL client tools (pg_dump)
- ❌ Less portable to non-PostgreSQL databases

**Requirements:**
- PostgreSQL client tools must be installed
- Windows: Download from https://www.postgresql.org/download/windows/
- Or install via Chocolatey: `choco install postgresql`

---

## Recommended Backup Strategy

**For Migration to Go + Astro:**
1. ✅ Run **JSON backup** first (for easy data import)
2. ✅ Run **SQL dump** as safety backup (for PostgreSQL restore)

**Commands:**
```bash
# 1. JSON backup
npx tsx scripts/backup-database.ts

# 2. SQL dump (Windows)
.\scripts\backup-database-sql.ps1

# 3. SQL dump (Linux/Mac)
./scripts/backup-database-sql.sh
```

---

## Backup Location

All backups are saved to: `./backups/`

**Example files:**
```
backups/
├── database-backup-2024-12-24-10-30-00.json      # JSON backup
└── database-backup-2024-12-24-10-31-00.sql.gz    # SQL dump (compressed)
```

---

## Restoring Backups

### Restore from JSON (for Go + GORM)

You'll need to write a Go script to import the JSON data:

```go
// Example Go code
type BackupData struct {
    Users         []User         `json:"users"`
    Categories    []Category     `json:"categories"`
    Movies        []Movie        `json:"movies"`
    TrendingMovies []TrendingMovie `json:"trendingMovies"`
    Settings      []Setting      `json:"settings"`
    StaticPages   []StaticPage   `json:"staticPages"`
}

// Read and import
data, _ := ioutil.ReadFile("backups/database-backup-2024-12-24.json")
var backup BackupData
json.Unmarshal(data, &backup)

// Insert into database using GORM
db.Create(&backup.Users)
db.Create(&backup.Categories)
// ... etc
```

### Restore from SQL Dump

**Windows:**
```powershell
# Decompress and restore
gunzip -c backups/database-backup-2024-12-24.sql.gz | psql -h $dbHost -U $dbUser -d $dbName
```

**Linux/Mac:**
```bash
# Decompress and restore
gunzip -c backups/database-backup-2024-12-24.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME
```

---

## Important Notes

⚠️ **Before Migration:**
- Always create BOTH backups (JSON + SQL)
- Test restore process on a test database
- Keep backups in multiple locations (local + cloud)
- Verify backup integrity before proceeding

💡 **Best Practices:**
- Create backups regularly during migration
- Keep at least 3 backup versions
- Store backups outside the project directory
- Consider uploading to cloud storage (Google Drive, Dropbox, etc.)

---

## Troubleshooting

### "pg_dump not found" Error

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Install PostgreSQL client tools
3. Add to PATH: `C:\Program Files\PostgreSQL\16\bin`

**Or use Chocolatey:**
```powershell
choco install postgresql
```

### "DATABASE_URL not found" Error

Make sure your `.env` file exists and contains:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### Permission Denied Error (Linux/Mac)

Make the script executable:
```bash
chmod +x scripts/backup-database-sql.sh
```

---

## Next Steps After Backup

1. ✅ Verify backup files exist in `./backups/`
2. ✅ Check file sizes are reasonable
3. ✅ Test restore on a test database (optional but recommended)
4. ✅ Upload backups to cloud storage
5. ✅ Proceed with migration to Go + Astro

---

**Created:** 2024-12-24  
**Last Updated:** 2024-12-24
