-- SQL Script to Update Screenshot URLs
-- Replace img.iwabp.xyz with image.linkmake.in in all movie screenshots

-- First, let's see how many movies will be affected
SELECT 
    COUNT(*) as total_movies_to_update,
    COUNT(CASE WHEN screenshot LIKE '%img.iwabp.xyz%' THEN 1 END) as movies_with_old_domain
FROM movies;

-- Preview the changes (first 10 rows)
SELECT 
    id,
    title,
    screenshot as old_screenshot,
    REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in') as new_screenshot
FROM movies
WHERE screenshot LIKE '%img.iwabp.xyz%'
LIMIT 10;

-- ACTUAL UPDATE QUERY
-- Run this to update all screenshot URLs
UPDATE movies
SET 
    screenshot = REPLACE(screenshot, 'img.iwabp.xyz', 'image.linkmake.in'),
    "updatedAt" = NOW()
WHERE screenshot LIKE '%img.iwabp.xyz%';

-- Verify the update
SELECT 
    COUNT(*) as total_movies,
    COUNT(CASE WHEN screenshot LIKE '%img.iwabp.xyz%' THEN 1 END) as old_domain_count,
    COUNT(CASE WHEN screenshot LIKE '%image.linkmake.in%' THEN 1 END) as new_domain_count
FROM movies;

-- Show some examples of updated screenshots
SELECT 
    id,
    title,
    screenshot
FROM movies
WHERE screenshot LIKE '%image.linkmake.in%'
LIMIT 10;
