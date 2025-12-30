# Local Database Setup - Quick Start

## ⚠️ Important: Update .env First!

Before running the setup script, you need to update your `.env` file to use the local database.

### Step 1: Update .env File

Open `d:\kailash\old_filmyfly\.env` and change the `DATABASE_URL` to:

```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/filmyfly?schema=public"
```

**Full .env example:**
```env
PORT=3000
NODE_ENV=development

# Local PostgreSQL database
DATABASE_URL="postgresql://postgres:root@localhost:5432/filmyfly?schema=public"

SESSION_SECRET=your-secret-key-here

# Firebase credentials (for admin auth)
FIREBASE_API_KEY=your-api-key
FIREBASE_AUTH_DOMAIN=your-auth-domain
FIREBASE_PROJECT_ID=your-project-id
# ... other Firebase settings
```

---

### Step 2: Make Sure PostgreSQL is Running

**Check if PostgreSQL is running:**

```powershell
Get-Service postgresql*
```

**If not running, start it:**

```powershell
Start-Service postgresql-x64-16  # or your version
```

**Or use pgAdmin** to start PostgreSQL.

---

### Step 3: Run Setup Script

```bash
npm run setup-db
```

This will:
1. ✅ Create `filmyfly` database
2. ✅ Run Prisma migrations (create tables)
3. ✅ Import data from `backup/movies.json`
4. ✅ Reset sequences

---

### Step 4: Verify Setup

**Start the server:**
```bash
npm run dev
```

**Test the API:**
```bash
curl http://localhost:3000/api/home
```

**Or visit in browser:**
- Homepage: http://localhost:3000
- API: http://localhost:3000/api/home
- Admin: http://localhost:3000/admin/login

---

## Troubleshooting

### Error: "Can't reach database server"

**Cause:** PostgreSQL is not running or wrong credentials.

**Solution:**
1. Check PostgreSQL is running: `Get-Service postgresql*`
2. Verify credentials in DATABASE_URL match your PostgreSQL setup
3. Default PostgreSQL password is usually `postgres` or empty

### Error: "Database already exists"

**Cause:** Database was created before.

**Solution:** This is fine! The script will skip creation and continue.

To start fresh:
```sql
psql -U postgres -h localhost
DROP DATABASE filmyfly;
\q
```

Then run `npm run setup-db` again.

### Error: "Backup file not found"

**Cause:** `backup/movies.json` doesn't exist.

**Solution:** Make sure you have the backup file at `d:\kailash\old_filmyfly\backup\movies.json`

---

## Quick Command Reference

```bash
# 1. Update .env file (use your text editor)
code .env  # or notepad .env

# 2. Check PostgreSQL
Get-Service postgresql*

# 3. Run setup
npm run setup-db

# 4. Start server
npm run dev

# 5. Test API
curl http://localhost:3000/api/home
```

---

## What DATABASE_URL Should Look Like

**Local PostgreSQL:**
```
DATABASE_URL="postgresql://postgres:root@localhost:5432/filmyfly?schema=public"
```

**Breakdown:**
- `postgresql://` - Protocol
- `postgres` - Username
- `root` - Password (change to your PostgreSQL password)
- `localhost` - Host
- `5432` - Port (default PostgreSQL port)
- `filmyfly` - Database name
- `?schema=public` - Schema

**Common PostgreSQL passwords:**
- `postgres` (default)
- `root`
- Empty (no password)
- Your custom password

---

## After Setup

Once setup is complete, you'll have:

✅ Local PostgreSQL database `filmyfly`  
✅ All tables created (users, categories, movies, etc.)  
✅ Data imported from backup  
✅ Ready for development  

You can now:
- Develop locally without internet
- Test API endpoints
- Build Astro frontend
- Make database changes safely

---

**Created:** 2024-12-28  
**For:** FilmyFly Local Development
