import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection
const DATABASE_URL = 'postgresql://postgres:admin@localhost:5432/filmyfly?schema=public';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error'],
});

// Configuration
const BATCH_SIZE = 50; // Number of movies to insert per batch
const DELAY_BETWEEN_BATCHES = 100; // Milliseconds to wait between batches (prevents overload)

interface MovieData {
  title: string;
  slug: string;
  description?: string;
  thumbnail?: string;
  genre?: string;
  languages?: string;
  duration?: string;
  releaseYear?: number;
  cast?: string;
  sizes?: string;
  downloadUrl?: string;
  screenshot?: string;
  keywords?: string;
}

interface ImportResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ index: number; title: string; error: string }>;
}

// Helper function to chunk array
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Helper function to delay
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Process a single batch
async function processBatch(
  batch: MovieData[],
  batchIndex: number,
  startIndex: number
): Promise<{ success: number; failed: number; errors: Array<{ index: number; title: string; error: string }> }> {
  let success = 0;
  let failed = 0;
  const errors: Array<{ index: number; title: string; error: string }> = [];

  for (let i = 0; i < batch.length; i++) {
    const movie = batch[i];
    const globalIndex = startIndex + i;

    try {
      // Validate required fields
      if (!movie.title || !movie.slug) {
        failed++;
        errors.push({
          index: globalIndex + 1,
          title: movie.title || 'Unknown',
          error: 'Title and slug are required'
        });
        continue;
      }

      // Check if slug already exists
      const existing = await prisma.movie.findUnique({
        where: { slug: movie.slug }
      });

      if (existing) {
        failed++;
        errors.push({
          index: globalIndex + 1,
          title: movie.title,
          error: `Slug "${movie.slug}" already exists`
        });
        continue;
      }

      // Insert movie
      await prisma.movie.create({
        data: {
          title: movie.title,
          slug: movie.slug,
          description: movie.description && movie.description !== 'Movies Description Not Available' 
            ? movie.description 
            : null,
          thumbnail: movie.thumbnail || null,
          genre: movie.genre || null,
          languages: movie.languages || null,
          duration: movie.duration || null,
          releaseYear: movie.releaseYear || null,
          cast: movie.cast || null,
          sizes: movie.sizes || null,
          downloadUrl: movie.downloadUrl || null,
          screenshot: movie.screenshot || null,
          keywords: movie.keywords || null
        }
      });

      success++;
    } catch (error: any) {
      failed++;
      errors.push({
        index: globalIndex + 1,
        title: movie.title || 'Unknown',
        error: error.message || 'Unknown error'
      });
    }
  }

  return { success, failed, errors };
}

// Main import function
async function importMovies(): Promise<void> {
  console.log('🚀 Starting movie import...\n');

  try {
    // Read JSON file
    console.log('📖 Reading movies.json file...');
    const filePath = join(__dirname, '../backup/movies.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const movies: MovieData[] = JSON.parse(fileContent);

    console.log(`✅ Loaded ${movies.length} movies from file\n`);

    // Split into batches
    const batches = chunkArray(movies, BATCH_SIZE);
    console.log(`📦 Processing ${batches.length} batches (${BATCH_SIZE} movies per batch)\n`);

    const result: ImportResult = {
      total: movies.length,
      success: 0,
      failed: 0,
      errors: []
    };

    const startTime = Date.now();

    // Process each batch
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const startIndex = i * BATCH_SIZE;
      const endIndex = Math.min(startIndex + BATCH_SIZE, movies.length);

      console.log(`\n📊 Processing batch ${i + 1}/${batches.length} (movies ${startIndex + 1}-${endIndex})...`);

      const batchResult = await processBatch(batch, i, startIndex);

      result.success += batchResult.success;
      result.failed += batchResult.failed;
      result.errors.push(...batchResult.errors);

      // Progress update
      const progress = ((i + 1) / batches.length * 100).toFixed(1);
      console.log(`   ✅ Success: ${batchResult.success} | ❌ Failed: ${batchResult.failed}`);
      console.log(`   📈 Overall Progress: ${progress}% (${result.success + result.failed}/${result.total})`);

      // Delay between batches to prevent database overload
      if (i < batches.length - 1) {
        await delay(DELAY_BETWEEN_BATCHES);
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Movies:     ${result.total}`);
    console.log(`✅ Successful:    ${result.success}`);
    console.log(`❌ Failed:        ${result.failed}`);
    console.log(`⏱️  Duration:      ${duration} seconds`);
    console.log(`📈 Success Rate:  ${((result.success / result.total) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));

    // Show errors if any
    if (result.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      console.log('='.repeat(60));
      // Show first 20 errors
      const errorsToShow = result.errors.slice(0, 20);
      errorsToShow.forEach(err => {
        console.log(`[${err.index}] ${err.title}: ${err.error}`);
      });
      if (result.errors.length > 20) {
        console.log(`\n... and ${result.errors.length - 20} more errors`);
      }
      console.log('='.repeat(60));
    }

    console.log('\n✅ Import completed!');

  } catch (error: any) {
    console.error('\n❌ Fatal error during import:', error.message);
    if (error.code === 'ENOENT') {
      console.error('   File not found: backup/movies.json');
    } else if (error instanceof SyntaxError) {
      console.error('   Invalid JSON format in movies.json');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run the import
importMovies()
  .then(() => {
    console.log('\n👋 Script finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });

