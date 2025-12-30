#!/bin/bash

# Database Backup Script for PostgreSQL (Supabase)
# This script creates a SQL dump of the entire database

set -e  # Exit on error

echo "🔄 Starting PostgreSQL database backup..."
echo ""

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "❌ Error: .env file not found!"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL not found in .env file!"
    exit 1
fi

# Parse DATABASE_URL
DB_URL=$DATABASE_URL
DB_USER=$(echo $DB_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
DB_PASS=$(echo $DB_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DB_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DB_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DB_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')

echo "📊 Database Connection Info:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Create backups directory
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/database-backup-$TIMESTAMP.sql"
BACKUP_FILE_GZ="$BACKUP_FILE.gz"

echo "💾 Creating SQL dump..."
echo "   Output: $BACKUP_FILE"
echo ""

# Set password for pg_dump
export PGPASSWORD=$DB_PASS

# Create SQL dump
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    --verbose \
    --file=$BACKUP_FILE \
    2>&1 | grep -v "^pg_dump:"

# Check if dump was successful
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SQL dump created successfully!"
    
    # Compress the backup
    echo "🗜️  Compressing backup..."
    gzip $BACKUP_FILE
    
    # Get file sizes
    COMPRESSED_SIZE=$(du -h $BACKUP_FILE_GZ | cut -f1)
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ Backup completed successfully!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📁 File: $(basename $BACKUP_FILE_GZ)"
    echo "📍 Location: $BACKUP_FILE_GZ"
    echo "📦 Size: $COMPRESSED_SIZE"
    echo "🕐 Timestamp: $TIMESTAMP"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "💡 To restore this backup, run:"
    echo "   gunzip -c $BACKUP_FILE_GZ | psql -h \$DB_HOST -U \$DB_USER -d \$DB_NAME"
    echo ""
    echo "💡 Keep this backup safe before starting migration!"
    
else
    echo "❌ Error: Backup failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo ""
echo "✨ Backup process completed!"
