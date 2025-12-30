import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Generate and save sitemap.xml to public directory as static file
 * This function should be called whenever content changes (movies, pages, categories)
 */
export async function generateSitemap(prisma: PrismaClient): Promise<void> {
  try {
    // Get site URL from settings
    const setting = await prisma.setting.findUnique({
      where: { key: 'siteUrl' }
    });
    const siteUrl = setting?.value || 'https://filmyfly.work';
    const baseUrl = siteUrl.replace(/\/$/, '');
    
    // Get current date in ISO format for lastmod
    const currentDate = new Date().toISOString().split('T')[0];
    
    // Start building sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
`;

    // 1. Homepage (highest priority)
    sitemap += `  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
`;

    // 2. Important static pages
    const staticPages = [
      { path: '/about', priority: '0.8', changefreq: 'monthly' },
      { path: '/page-how-to-download-movie', priority: '0.8', changefreq: 'monthly' }
    ];

    staticPages.forEach(page => {
      sitemap += `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>
`;
    });

    // 3. Published static pages from database
    try {
      const publishedPages = await prisma.staticPage.findMany({
        where: { isPublished: true },
        select: {
          slug: true,
          updatedAt: true
        }
      });

      publishedPages.forEach(page => {
        const lastmod = new Date(page.updatedAt).toISOString().split('T')[0];
        sitemap += `  <url>
    <loc>${baseUrl}/site-${page.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
      });
    } catch (error) {
      await logger.warn('Could not fetch static pages for sitemap:', error);
    }

    // 4. Category pages
    try {
      const categories = await prisma.category.findMany({
        select: {
          id: true,
          slug: true,
          updatedAt: true
        }
      });

      categories.forEach(category => {
        const lastmod = new Date(category.updatedAt).toISOString().split('T')[0];
        sitemap += `  <url>
    <loc>${baseUrl}/page-cat/${category.id}/${category.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
`;
      });
    } catch (error) {
      await logger.warn('Could not fetch categories for sitemap:', error);
    }

    // 5. All movie pages (most important for SEO)
    try {
      const movies = await prisma.movie.findMany({
        select: {
          slug: true,
          updatedAt: true,
          thumbnail: true,
          title: true
        },
        orderBy: {
          updatedAt: 'desc'
        }
      });

      movies.forEach(movie => {
        const lastmod = new Date(movie.updatedAt).toISOString().split('T')[0];
        sitemap += `  <url>
    <loc>${baseUrl}/${movie.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

        // Add image if thumbnail exists (for Google Images)
        if (movie.thumbnail) {
          // Escape XML special characters in title
          const escapedTitle = movie.title
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
          
          sitemap += `
    <image:image>
      <image:loc>${movie.thumbnail.replace(/&/g, '&amp;')}</image:loc>
      <image:title>${escapedTitle}</image:title>
    </image:image>`;
        }

        sitemap += `
  </url>
`;
      });
    } catch (error) {
      await logger.warn('Could not fetch movies for sitemap:', error);
    }

    // Close sitemap
    sitemap += `</urlset>`;

    // Save to public directory
    const publicDir = join(__dirname, '../../public');
    const sitemapPath = join(publicDir, 'sitemap.xml');
    
    await writeFile(sitemapPath, sitemap, 'utf-8');
    
    await logger.info('Sitemap.xml generated successfully at:', sitemapPath);
    
    // Submit to Google Search Console
    await submitSitemapToGoogle(baseUrl);
    
  } catch (error: any) {
    await logger.error('Error generating sitemap.xml:', error);
    throw error;
  }
}

/**
 * Note: Google discontinued the sitemap ping endpoint in late 2023
 * To submit your sitemap to Google:
 * 
 * 1. MANUAL SUBMISSION (Recommended):
 *    - Go to https://search.google.com/search-console
 *    - Add your property (site URL)
 *    - Go to Sitemaps section
 *    - Submit: https://yourdomain.com/sitemap.xml
 * 
 * 2. AUTOMATIC DISCOVERY:
 *    - Sitemap URL is already included in robots.txt
 *    - Google will discover it automatically when crawling
 * 
 * 3. API SUBMISSION (Advanced - requires OAuth/Service Account):
 *    - Use Google Search Console API
 *    - Requires OAuth 2.0 credentials
 *    - Requires site verification
 */
async function submitSitemapToGoogle(siteUrl: string): Promise<void> {
  try {
    const sitemapUrl = `${siteUrl}/sitemap.xml`;
    
    // Note: Google ping endpoint was discontinued in late 2023
    // The sitemap is automatically discoverable via robots.txt
    // For best results, submit manually through Google Search Console
    
    await logger.info('Sitemap generated:', sitemapUrl);
    await logger.info('To submit to Google: Go to https://search.google.com/search-console and add your sitemap');
    await logger.info('Sitemap is also referenced in robots.txt for automatic discovery');
    
    // Optional: Try Bing sitemap submission (still works)
    try {
      const bingPingUrl = `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
      const bingResponse = await fetch(bingPingUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'FilmyFly-Sitemap-Bot/1.0'
        }
      });
      
      if (bingResponse.ok) {
        await logger.info('Sitemap submitted to Bing:', sitemapUrl);
      }
    } catch (bingError) {
      // Bing submission is optional, don't log errors
    }
  } catch (error: any) {
    // Don't throw error, just log it - sitemap generation should still succeed
    await logger.warn('Note: Sitemap submission info:', error.message);
  }
}

