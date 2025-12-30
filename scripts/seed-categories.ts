import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

// Create PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('⚠️  DATABASE_URL environment variable is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

const adapter = new PrismaPg(pool);

// Prisma Client with adapter
const prisma = new PrismaClient({
  adapter: adapter,
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

const categories = [
  { name: 'Web Series', slug: 'web-series' },
  { name: 'South Hindi Dubbed Movies', slug: 'south-hindi-dubbed-movies' },
  { name: 'Bollywood Movies', slug: 'bollywood-movies' },
  { name: '18+ Web Series', slug: '18-web-series' },
  { name: 'Animation Movies', slug: 'animation-movies' },
  { name: 'Bollywood Hindi Movies', slug: 'bollywood-hindi-movies' },
  { name: 'Hollywood Hindi Movies', slug: 'hollywood-hindi-movies' },
  { name: 'HQ Dubbed Movies (UnCut)', slug: 'hq-dubbed-movies-uncut' },
  { name: 'HQ Hindi Dub Movie [With ads]', slug: 'hq-hindi-dub-movie-with-ads' },
  { name: 'K-Drama (Hindi Dubbed)', slug: 'k-drama-hindi-dubbed' },
  { name: 'Others Language Movies', slug: 'others-language-movies' },
  { name: 'Punjabi Movies', slug: 'punjabi-movies' },
  { name: 'South Hindi Dubbed Movie', slug: 'south-hindi-dubbed-movie' },
  { name: 'Star Cast Movie Collection', slug: 'star-cast-movie-collection' }
];

async function seedCategories() {
  console.log('🌱 Seeding categories...');

  for (const category of categories) {
    try {
      await prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name },
        create: {
          name: category.name,
          slug: category.slug
        }
      });
      console.log(`✅ Created/Updated: ${category.name}`);
    } catch (error) {
      console.error(`❌ Error creating ${category.name}:`, error);
    }
  }

  console.log('✨ Categories seeding completed!');
}

seedCategories()
  .catch((error) => {
    console.error('Error seeding categories:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

