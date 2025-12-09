# Movie Import Script

This script allows you to import movies from a JSON file into your PostgreSQL database using batch processing for safe and efficient data insertion.

## Prerequisites

1. **Database Setup**: Make sure your PostgreSQL database is running and accessible
2. **Database URL**: The script uses the connection string: `postgresql://postgres:admin@localhost:5432/filmyfly?schema=public`
3. **JSON File**: Ensure `backup/movies.json` exists and contains valid movie data
4. **Prisma Client**: Run `npm run prisma:generate` to ensure Prisma client is generated

## Usage

### Basic Usage

Simply run the import script:

```bash
npm run import:movies
```

### What Happens

1. The script reads all movies from `backup/movies.json`
2. Splits them into batches of 50 movies each
3. Processes each batch sequentially with a small delay to prevent database overload
4. Shows real-time progress for each batch
5. Displays a final summary with statistics

## Configuration

You can modify the following settings in `scripts/import-movies.ts`:

- **BATCH_SIZE**: Number of movies to process per batch (default: 50)
  ```typescript
  const BATCH_SIZE = 50; // Increase for faster import, decrease for safer import
  ```

- **DELAY_BETWEEN_BATCHES**: Milliseconds to wait between batches (default: 100ms)
  ```typescript
  const DELAY_BETWEEN_BATCHES = 100; // Increase if database is slow
  ```

- **DATABASE_URL**: Database connection string (default: hardcoded in script)
  ```typescript
  const DATABASE_URL = 'postgresql://postgres:admin@localhost:5432/filmyfly?schema=public';
  ```

## Output Example

```
🚀 Starting movie import...

📖 Reading movies.json file...
✅ Loaded 1000 movies from file

📦 Processing 20 batches (50 movies per batch)

📊 Processing batch 1/20 (movies 1-50)...
   ✅ Success: 48 | ❌ Failed: 2
   📈 Overall Progress: 5.0% (50/1000)

📊 Processing batch 2/20 (movies 51-100)...
   ✅ Success: 50 | ❌ Failed: 0
   📈 Overall Progress: 10.0% (100/1000)

...

============================================================
📊 IMPORT SUMMARY
============================================================
Total Movies:     1000
✅ Successful:    985
❌ Failed:        15
⏱️  Duration:      45.32 seconds
📈 Success Rate:  98.50%
============================================================
```

## Error Handling

The script handles various error scenarios:

- **Missing required fields**: Movies without `title` or `slug` are skipped
- **Duplicate slugs**: Movies with existing slugs are skipped
- **Database errors**: Connection issues or constraint violations are caught and reported
- **Invalid JSON**: File format errors are caught with helpful messages

## Error Report

If any movies fail to import, the script will show:
- Movie index in the JSON file
- Movie title
- Error reason

Example:
```
❌ ERRORS:
============================================================
[5] Movie Title: Slug "movie-slug" already exists
[23] Unknown: Title and slug are required
[45] Another Movie: Database constraint violation
============================================================
```

## Troubleshooting

### Database Connection Error

If you see connection errors:
1. Verify PostgreSQL is running
2. Check the DATABASE_URL in the script matches your setup
3. Ensure the database `filmyfly` exists
4. Verify username and password are correct

### File Not Found Error

If you see "File not found":
1. Ensure `backup/movies.json` exists in the project root
2. Check the file path is correct relative to the script location

### Invalid JSON Error

If you see JSON parsing errors:
1. Validate your JSON file format
2. Ensure the file is valid JSON (use a JSON validator)
3. Check for trailing commas or syntax errors

### Performance Tips

- **For large files (10,000+ movies)**: Increase `BATCH_SIZE` to 100-200
- **For slow databases**: Increase `DELAY_BETWEEN_BATCHES` to 200-500ms
- **For fast databases**: Decrease `DELAY_BETWEEN_BATCHES` to 50ms or remove delay

## Data Format

The JSON file should contain an array of movie objects with the following structure:

```json
[
  {
    "title": "Movie Title",
    "slug": "movie-slug",
    "description": "Movie description",
    "thumbnail": "https://example.com/thumb.jpg",
    "genre": "Action, Drama",
    "languages": "English, Hindi",
    "duration": "2h 30m",
    "releaseYear": 2024,
    "cast": "Actor One, Actor Two",
    "sizes": "720p, 1080p",
    "downloadUrl": "https://example.com/download",
    "screenshot": "https://example.com/screenshot.jpg",
    "keywords": "action, drama, movie"
  }
]
```

**Required fields**: `title`, `slug`  
**Optional fields**: All other fields can be omitted or set to empty strings

## Notes

- The script automatically skips movies with "Movies Description Not Available" and sets description to null
- Duplicate slugs are detected and skipped (won't overwrite existing movies)
- The script processes movies sequentially to ensure database stability
- Progress is shown in real-time for each batch

## Safety Features

✅ **Batch Processing**: Prevents database overload  
✅ **Error Isolation**: One failed movie doesn't stop the entire import  
✅ **Duplicate Detection**: Prevents overwriting existing movies  
✅ **Progress Tracking**: Real-time feedback on import status  
✅ **Comprehensive Reporting**: Detailed summary of success/failure

