# Database Backup Script for Windows (PowerShell)
# This script creates a SQL dump of the PostgreSQL database

Write-Host "🔄 Starting PostgreSQL database backup..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-Not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    exit 1
}

# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        Set-Item -Path "env:$name" -Value $value
    }
}

# Check if DATABASE_URL exists
if (-Not $env:DATABASE_URL) {
    Write-Host "❌ Error: DATABASE_URL not found in .env file!" -ForegroundColor Red
    exit 1
}

# Parse DATABASE_URL
# Format: postgresql://user:password@host:port/database
$dbUrl = $env:DATABASE_URL
if ($dbUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/([^?]+)') {
    $dbUser = $matches[1]
    $dbPass = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
} else {
    Write-Host "❌ Error: Could not parse DATABASE_URL!" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database Connection Info:" -ForegroundColor Yellow
Write-Host "   Host: $dbHost"
Write-Host "   Port: $dbPort"
Write-Host "   Database: $dbName"
Write-Host "   User: $dbUser"
Write-Host ""

# Create backups directory
$backupDir = ".\backups"
if (-Not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

# Generate filename with timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir\database-backup-$timestamp.sql"

Write-Host "💾 Creating SQL dump..." -ForegroundColor Cyan
Write-Host "   Output: $backupFile"
Write-Host ""

# Set password environment variable for pg_dump
$env:PGPASSWORD = $dbPass

# Check if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue

if (-Not $pgDumpPath) {
    Write-Host "❌ Error: pg_dump not found!" -ForegroundColor Red
    Write-Host "💡 Please install PostgreSQL client tools:" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    Write-Host "   Or install via Chocolatey: choco install postgresql" -ForegroundColor Yellow
    exit 1
}

# Create SQL dump
try {
    & pg_dump -h $dbHost -p $dbPort -U $dbUser -d $dbName `
        --no-owner `
        --no-acl `
        --clean `
        --if-exists `
        --file=$backupFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SQL dump created successfully!" -ForegroundColor Green
        
        # Get file size
        $fileSize = (Get-Item $backupFile).Length
        $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
        
        Write-Host ""
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "✅ Backup completed successfully!" -ForegroundColor Green
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host "📁 File: $(Split-Path $backupFile -Leaf)"
        Write-Host "📍 Location: $backupFile"
        Write-Host "📦 Size: $fileSizeMB MB"
        Write-Host "🕐 Timestamp: $timestamp"
        Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
        Write-Host ""
        Write-Host "💡 To restore this backup, run:" -ForegroundColor Yellow
        Write-Host "   psql -h `$dbHost -U `$dbUser -d `$dbName -f $backupFile" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "💡 Keep this backup safe before starting migration!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Error: Backup failed!" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error during backup: $_" -ForegroundColor Red
    exit 1
} finally {
    # Unset password
    Remove-Item env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host ""
Write-Host "✨ Backup process completed!" -ForegroundColor Green
