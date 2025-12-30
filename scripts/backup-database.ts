import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

interface DatabaseConfig {
  user: string;
  password: string;
  host: string;
  port: string;
  database: string;
}

function parseDatabaseUrl(url: string): DatabaseConfig {
  // Format: postgresql://user:password@host:port/database
  const regex = /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/([^?]+)/;
  const match = url.match(regex);

  if (!match) {
    throw new Error('Invalid DATABASE_URL format');
  }

  return {
    user: match[1],
    password: match[2],
    host: match[3],
    port: match[4],
    database: match[5],
  };
}

async function checkPgDump(): Promise<boolean> {
  try {
    await execAsync('pg_dump --version');
    return true;
  } catch {
    return false;
  }
}

async function backupWithPgDump(config: DatabaseConfig, backupDir: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `database-backup-${timestamp}-${timeStr}.sql`;
  const filepath = path.join(backupDir, filename);

  log('\n💾 Creating SQL dump with pg_dump...', colors.blue);
  log(`   Output: ${filename}`, colors.blue);

  // Set password environment variable
  const env = { ...process.env, PGPASSWORD: config.password };

  // Build pg_dump command
  const command = `pg_dump -h ${config.host} -p ${config.port} -U ${config.user} -d ${config.database} --no-owner --no-acl --clean --if-exists --file="${filepath}"`;

  try {
    await execAsync(command, { env, maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

    log('✅ SQL dump created successfully!', colors.green);

    // Compress the file
    log('🗜️  Compressing backup...', colors.blue);

    // Read file and compress
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const zlib = await import('zlib');
    const compressed = zlib.gzipSync(fileContent);

    const compressedPath = `${filepath}.gz`;
    fs.writeFileSync(compressedPath, compressed);

    // Delete uncompressed file
    fs.unlinkSync(filepath);

    return compressedPath;
  } catch (error: any) {
    throw new Error(`pg_dump failed: ${error.message}`);
  }
}

async function backupWithPrisma(backupDir: string): Promise<string> {
  log('\n📊 Creating JSON backup with Prisma...', colors.blue);

  // Fetch all data
  log('   Fetching users...', colors.blue);
  const users = await prisma.user.findMany();

  log('   Fetching categories...', colors.blue);
  const categories = await prisma.category.findMany();

  log('   Fetching movies...', colors.blue);
  const movies = await prisma.movie.findMany({
    include: {
      category: true,
      TrendingMovie: true
    }
  });

  log('   Fetching trending movies...', colors.blue);
  const trendingMovies = await prisma.trendingMovie.findMany({
    include: {
      movie: true
    }
  });

  log('   Fetching settings...', colors.blue);
  const settings = await prisma.setting.findMany();

  log('   Fetching static pages...', colors.blue);
  const staticPages = await prisma.staticPage.findMany();

  // Get schema using raw query
  log('   Fetching database schema...', colors.blue);
  const schemaQuery = `
    SELECT 
      table_name,
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `;

  const schema = await prisma.$queryRawUnsafe(schemaQuery);

  const totalRecords = users.length + categories.length + movies.length +
    trendingMovies.length + settings.length + staticPages.length;

  const backupData = {
    metadata: {
      backupDate: new Date().toISOString(),
      totalRecords,
      version: '1.0.0',
      databaseType: 'PostgreSQL',
      prismaVersion: '7.1.0'
    },
    schema,
    data: {
      users,
      categories,
      movies,
      trendingMovies,
      settings,
      staticPages
    }
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const timeStr = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `database-backup-${timestamp}-${timeStr}.json`;
  const filepath = path.join(backupDir, filename);

  fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));

  return filepath;
}

async function main() {
  try {
    log('═══════════════════════════════════════════════════════', colors.bright);
    log('🔄 FilmyFly Database Backup Tool', colors.bright);
    log('═══════════════════════════════════════════════════════', colors.bright);

    // Check DATABASE_URL
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL not found in environment variables');
    }

    // Parse database config
    const config = parseDatabaseUrl(databaseUrl);
    log(`\n📊 Database: ${config.database}@${config.host}`, colors.blue);

    // Create backups directory
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      log(`📁 Created backups directory: ${backupDir}`, colors.green);
    }

    // Check if pg_dump is available
    const hasPgDump = await checkPgDump();

    let backupPath: string;
    let backupType: string;

    if (hasPgDump) {
      log('\n✅ pg_dump found - Creating SQL dump (recommended)', colors.green);
      backupPath = await backupWithPgDump(config, backupDir);
      backupType = 'SQL Dump (compressed)';
    } else {
      log('\n⚠️  pg_dump not found - Using Prisma JSON backup', colors.yellow);
      log('   For better backups, install PostgreSQL tools:', colors.yellow);
      log('   https://www.postgresql.org/download/', colors.yellow);
      backupPath = await backupWithPrisma(backupDir);
      backupType = 'JSON Backup';
    }

    // Get file size
    const stats = fs.statSync(backupPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    // Get record counts
    const userCount = await prisma.user.count();
    const categoryCount = await prisma.category.count();
    const movieCount = await prisma.movie.count();
    const trendingCount = await prisma.trendingMovie.count();
    const settingCount = await prisma.setting.count();
    const pageCount = await prisma.staticPage.count();
    const totalRecords = userCount + categoryCount + movieCount + trendingCount + settingCount + pageCount;

    log('\n═══════════════════════════════════════════════════════', colors.green);
    log('✅ BACKUP COMPLETED SUCCESSFULLY!', colors.green);
    log('═══════════════════════════════════════════════════════', colors.green);
    log(`\n📁 File: ${path.basename(backupPath)}`, colors.bright);
    log(`📍 Location: ${backupPath}`, colors.bright);
    log(`📦 Size: ${fileSizeMB} MB`, colors.bright);
    log(`📊 Type: ${backupType}`, colors.bright);
    log(`🕐 Date: ${new Date().toLocaleString()}`, colors.bright);

    log('\n📋 Backup Summary:', colors.blue);
    log(`   • Users: ${userCount}`, colors.blue);
    log(`   • Categories: ${categoryCount}`, colors.blue);
    log(`   • Movies: ${movieCount}`, colors.blue);
    log(`   • Trending Movies: ${trendingCount}`, colors.blue);
    log(`   • Settings: ${settingCount}`, colors.blue);
    log(`   • Static Pages: ${pageCount}`, colors.blue);
    log(`   • Total Records: ${totalRecords}`, colors.blue);

    if (hasPgDump) {
      log('\n💡 To restore this backup:', colors.yellow);
      log(`   gunzip -c "${backupPath}" | psql -h ${config.host} -U ${config.user} -d ${config.database}`, colors.yellow);
    } else {
      log('\n💡 This JSON backup can be imported into Go + GORM', colors.yellow);
    }

    log('\n✨ Backup saved successfully!', colors.green);
    log('🔒 Keep this file safe before starting migration!', colors.green);
    log('═══════════════════════════════════════════════════════\n', colors.green);

  } catch (error: any) {
    log('\n═══════════════════════════════════════════════════════', colors.red);
    log('❌ BACKUP FAILED', colors.red);
    log('═══════════════════════════════════════════════════════', colors.red);
    log(`\nError: ${error.message}`, colors.red);

    if (error.message.includes('DATABASE_URL')) {
      log('\n💡 Make sure .env file exists with DATABASE_URL', colors.yellow);
    } else if (error.message.includes('connect')) {
      log('\n💡 Check your database connection settings', colors.yellow);
    }

    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run backup
main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
