-- ============================================================================
-- SCREENSHOT URL UPDATE SCRIPT
-- ============================================================================
-- This script updates all movie screenshot URLs from img.iwabp.xyz to image.linkmake.in
-- 
-- USAGE:
-- 1. Connect to your PostgreSQL database
-- 2. Run each section in order
-- 3. Verify the results
-- ============================================================================

-- ============================================================================
-- STEP 1: CHECK CURRENT STATE
-- ============================================================================
-- See how many movies will be affected
SELECT 
    'Total movies' as metric,
    COUNT(*) as count
FROM movies
UNION ALL
SELECT 
    'Movies with screenshots' as metric,
    COUNT(*) as count
FROM movies
WHERE screenshot IS NOT NULL
UNION ALL
SELECT 
    'Movies with old domain (img.iwabp.xyz)' as metric,
    COUNT(*) as count
FROM movies
WHERE screenshot LIKE '%img.iwabp.xyz%'
UNION ALL
SELECT 
    'Movies with new domain (image.linkmake.in)' as metric,
    COUNT(*) as count
FROM movies
WHERE screenshot LIKE '%image.linkmake.in%';

-- ============================================================================
-- STEP 2: PREVIEW CHANGES
-- ============================================================================
-- See what will be changed (first 20 rows)
SELECT 
    id,
    title,
    screenshot as current_url,
    REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in') as new_url
FROM movies
WHERE screenshot LIKE '%img.iwabp.xyz%'
ORDER BY id
LIMIT 20;

-- ============================================================================
-- STEP 3: PERFORM THE UPDATE
-- ============================================================================
-- ⚠️ IMPORTANT: Make sure you've reviewed the preview above before running this!
-- This will update ALL movies with the old domain

UPDATE movies
SET 
    screenshot = REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in'),
    "updatedAt" = NOW()
WHERE screenshot LIKE '%img.iwabp.xyz%';

-- You should see output like: "UPDATE 150" (where 150 is the number of rows updated)

-- ============================================================================
-- STEP 4: VERIFY THE UPDATE
-- ============================================================================
-- Check that the update was successful
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

-- ============================================================================
-- STEP 5: VIEW SAMPLE UPDATED RECORDS
-- ============================================================================
-- See some examples of updated screenshots
SELECT 
    id,
    title,
    screenshot
FROM movies
WHERE screenshot LIKE '%image.linkmake.in%'
ORDER BY "updatedAt" DESC
LIMIT 10;

-- ============================================================================
-- OPTIONAL: ROLLBACK (if something went wrong)
-- ============================================================================
-- If you need to revert the changes, run this:
-- 
-- UPDATE movies
-- SET 
--     screenshot = REPLACE(screenshot, 'image.linkmake.in', 'img.iwabp.xyz'),
--     "updatedAt" = NOW()
-- WHERE screenshot LIKE '%image.linkmake.in%';
-- ============================================================================
