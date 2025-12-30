# Screenshot URL Update Script
# Updates all movie screenshot URLs from img.iwabp.xyz to image.linkmake.in

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Screenshot URL Update Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Get database connection string from .env file
$envFile = Get-Content .env -ErrorAction SilentlyContinue
$databaseUrl = ($envFile | Where-Object { $_ -match '^DATABASE_URL=' }) -replace 'DATABASE_URL=', '' -replace '"', ''

if (-not $databaseUrl) {
    Write-Host "❌ Error: Could not find DATABASE_URL in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found database connection" -ForegroundColor Green
Write-Host "`nThis script will update screenshot URLs:" -ForegroundColor Yellow
Write-Host "  FROM: img.iwabp.xyz" -ForegroundColor Red
Write-Host "  TO:   image.linkmake.in`n" -ForegroundColor Green

# Parse the connection string
if ($databaseUrl -match 'postgresql://([^:]+):([^@]+)@([^:]+):(\d+)/(.+)') {
    $dbUser = $matches[1]
    $dbPassword = $matches[2]
    $dbHost = $matches[3]
    $dbPort = $matches[4]
    $dbName = $matches[5]
    
    Write-Host "Database: $dbName" -ForegroundColor Cyan
    Write-Host "Host: $dbHost:$dbPort`n" -ForegroundColor Cyan
} else {
    Write-Host "❌ Error: Could not parse DATABASE_URL" -ForegroundColor Red
    exit 1
}

# Set environment variable for psql
$env:PGPASSWORD = $dbPassword

Write-Host "📊 Checking current state...`n" -ForegroundColor Yellow

# Check how many movies need updating
$checkQuery = @"
SELECT COUNT(*) FROM movies WHERE screenshot LIKE '%img.iwabp.xyz%';
"@

try {
    $count = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -t -c $checkQuery 2>&1
    $count = $count.Trim()
    
    if ($count -match '^\d+$') {
        Write-Host "Found $count movies with old domain (img.iwabp.xyz)`n" -ForegroundColor Cyan
        
        if ([int]$count -eq 0) {
            Write-Host "✅ No movies need updating. All done!" -ForegroundColor Green
            exit 0
        }
    } else {
        Write-Host "⚠️  Could not determine movie count. Error: $count" -ForegroundColor Yellow
        Write-Host "Continuing anyway...`n" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not check movie count: $_" -ForegroundColor Yellow
    Write-Host "Continuing anyway...`n" -ForegroundColor Yellow
}

# Show preview
Write-Host "📋 Preview of changes (first 5):`n" -ForegroundColor Yellow

$previewQuery = @"
SELECT 
    id,
    title,
    screenshot as current_url,
    REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in') as new_url
FROM movies
WHERE screenshot LIKE '%img.iwabp.xyz%'
ORDER BY id
LIMIT 5;
"@

try {
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $previewQuery 2>&1 | Out-Host
} catch {
    Write-Host "⚠️  Could not show preview: $_" -ForegroundColor Yellow
}

Write-Host "`n⚠️  WARNING: This will update ALL movies with the old domain!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel, or any other key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

Write-Host "`n🚀 Updating screenshot URLs...`n" -ForegroundColor Green

# Perform the update
$updateQuery = @"
UPDATE movies
SET 
    screenshot = REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in'),
    "updatedAt" = NOW()
WHERE screenshot LIKE '%img.iwabp.xyz%';
"@

try {
    $result = psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $updateQuery 2>&1
    Write-Host $result -ForegroundColor Green
    
    # Verify the update
    Write-Host "`n📊 Verifying update...`n" -ForegroundColor Yellow
    
    $verifyQuery = @"
SELECT 
    'Movies with old domain (should be 0)' as metric,
    COUNT(*) as count
FROM movies
WHERE screenshot LIKE '%img.iwabp.xyz%'
UNION ALL
SELECT 
    'Movies with new domain' as metric,
    COUNT(*) as count
FROM movies
WHERE screenshot LIKE '%image.linkmake.in%';
"@
    
    psql -h $dbHost -p $dbPort -U $dbUser -d $dbName -c $verifyQuery 2>&1 | Out-Host
    
    Write-Host "`n✅ Update complete!`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n❌ Error during update: $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Host "========================================`n" -ForegroundColor Cyan
