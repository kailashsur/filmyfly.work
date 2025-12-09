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

const defaultSettings = [
  {
    key: 'downloadRedirectUrl',
    value: 'https://kailashsur.in/top-investment-strategies-beginners/?redirect=',
    description: 'Redirect URL for download links'
  },
  {
    key: 'siteUrl',
    value: 'https://filmyfly.work',
    description: 'Site URL (used in meta tags, Open Graph, Twitter Card, etc.)'
  }
];

async function seedSettings() {
  console.log('🌱 Seeding settings...');

  for (const setting of defaultSettings) {
    try {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: { 
          value: setting.value,
          description: setting.description
        },
        create: {
          key: setting.key,
          value: setting.value,
          description: setting.description
        }
      });
      console.log(`✅ Created/Updated: ${setting.key} = ${setting.value}`);
    } catch (error) {
      console.error(`❌ Error creating ${setting.key}:`, error);
    }
  }

  console.log('✨ Settings seeding completed!');
}

seedSettings()
  .catch((error) => {
    console.error('Error seeding settings:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });

