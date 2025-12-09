import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

// Helper function to generate long tag string for SEO
function generateLongTag(movie: any): string {
  const title = movie.title;
  const year = movie.releaseYear || '';
  const yearStr = year ? ` ${year}` : '';
  
  // Determine movie type based on category or default to "Bollywood Hindi Movie"
  let movieType = 'Bollywood Hindi Movie';
  if (movie.category) {
    const categoryName = movie.category.name.toLowerCase();
    if (categoryName.includes('hollywood')) {
      movieType = 'Hollywood Hindi Movie';
    } else if (categoryName.includes('south')) {
      movieType = 'South Hindi Dubbed Movie';
    } else if (categoryName.includes('animation')) {
      movieType = 'Animation Movie';
    } else if (categoryName.includes('k-drama')) {
      movieType = 'K-Drama Hindi Dubbed';
    } else if (categoryName.includes('punjabi')) {
      movieType = 'Punjabi Movie';
    }
  }
  
  // Check if it's a dual audio based on languages
  const isDualAudio = movie.languages && movie.languages.toLowerCase().includes('english') && 
                      movie.languages.toLowerCase().includes('hindi');
  if (isDualAudio && movieType.includes('Hollywood')) {
    movieType = 'Hollywood Movie';
  }
  
  const baseTitle = `${title}${yearStr}`;
  
  // Core tag variations matching the example format
  const variations = [
    `${baseTitle} ${movieType} HD ESub Filmy4wap`,
    `${baseTitle} ${movieType} HD ESub`,
    `${baseTitle} ${movieType} HD ESub filmy4wap.xyz`,
    `${baseTitle} ${movieType} HD ESub 480p Download`,
    `${baseTitle} ${movieType} HD ESub 720p Download`,
    `${baseTitle} ${movieType} HD ESub HEVC Download`,
    `${baseTitle} ${movieType} HD ESub Filmy4wep`,
    `${baseTitle} ${movieType} HD ESub filmywap`,
    `${baseTitle} ${movieType} HD ESub 400mb`,
    `${baseTitle} ${movieType} HD ESub Full Movie Download`,
    `${baseTitle} ${movieType} HD ESub filmy4wap.com.de`,
    `${baseTitle} ${movieType} HD ESub filmy4wap.Pro`,
    `${baseTitle} ${movieType} HD ESub filmy4wap.xy`,
    `${baseTitle} ${movieType} HD ESub Filmy4wap.in`,
    `${baseTitle} ${movieType} HD ESub 1filmy4wap.in`
  ];
  
  // Add dual audio variation if applicable
  if (isDualAudio) {
    variations.push(`${baseTitle} Hindi English Dual Audio ${movieType} HD ESub`);
  }
  
  // Add generic site names at the end
  const genericSites = [
    'filmy4wap.xyz',
    'filmy4wap.com.de'
  ];
  
  // Combine all variations
  const allTags = [...variations, ...genericSites];
  
  return allTags.join(',');
}

export const getHomePage = async (req: Request, res: Response): Promise<void> => {
  try {
    // Pagination settings - 50 movies per page for recent movies section
    const ITEMS_PER_PAGE = 50;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Fetch all trending movies
    const trendingMoviesData = await prisma.trendingMovie.findMany({
      orderBy: { order: 'asc' },
      include: {
        movie: {
          select: {
            title: true,
            slug: true,
            thumbnail: true,
            keywords: true
          }
        }
      }
    });
    
    const trendingMovies = trendingMoviesData
      .map(tm => tm.movie)
      .filter(m => m !== null);

    // Fetch total count of movies for pagination
    const totalMovies = await prisma.movie.count();
    const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

    // Fetch paginated recent movies
    const recentMovies = await prisma.movie.findMany({
      skip: skip,
      take: ITEMS_PER_PAGE,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        title: true,
        slug: true,
        thumbnail: true,
        keywords: true
      }
    });

    // Fetch all categories
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { movies: true }
        }
      }
    });

    res.render('index', {
      title: 'Home',
      message: 'Welcome to FilmyFly!',
      trendingMovies: trendingMovies,
      recentMovies: recentMovies,
      categories: categories,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error: any) {
    logger.error('Error fetching movies:', error).catch(() => {});
    res.render('index', {
      title: 'Home',
      message: 'Welcome to FilmyFly!',
      trendingMovies: [],
      recentMovies: [],
      categories: [],
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false
    });
  }
};

export const getAboutPage = (_req: Request, res: Response): void => {
  res.render('about', {
    title: 'About',
    message: 'This is the about page.'
  });
};

export const getHowToDownloadPage = (_req: Request, res: Response): void => {
  res.render('how-to-download', {
    title: 'How To Download Movies On FilmyFly',
    message: 'Learn how to download movies from FilmyFly'
  });
};

export const getRobotsTxt = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get site URL from settings (via res.locals which is set by middleware)
    const siteUrl = res.locals.settings?.siteUrl || 'https://filmyfly.how';
    
    // Generate robots.txt content
    const robotsContent = `# robots.txt for FilmyFly
# Allow all search engines to crawl the site

User-agent: *
Allow: /
Disallow: /admin/
Disallow: /admin/*
Disallow: /api/
Disallow: /*?page=
Disallow: /search?to-search=

# Allow specific important pages
Allow: /about
Allow: /page-how-to-download-movie
Allow: /site-privacy-policy
Allow: /site-contact-us
Allow: /site-about-us
Allow: /site-dmca

# Crawl-delay (optional, adjust as needed)
Crawl-delay: 1

# Sitemap location
Sitemap: ${siteUrl}/sitemap.xml
`;

    res.setHeader('Content-Type', 'text/plain');
    res.send(robotsContent);
  } catch (error: any) {
    logger.error('Error generating robots.txt:', error).catch(() => {});
    // Fallback to basic robots.txt
    res.setHeader('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
`);
  }
};

export const getSitemapXml = async (_req: Request, res: Response): Promise<void> => {
  try {
    // Get site URL from settings
    const siteUrl = res.locals.settings?.siteUrl || 'https://filmyfly.how';
    // Ensure siteUrl doesn't end with a slash
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
      logger.warn('Could not fetch static pages for sitemap:', error).catch(() => {});
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
      logger.warn('Could not fetch categories for sitemap:', error).catch(() => {});
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
      logger.warn('Could not fetch movies for sitemap:', error).catch(() => {});
    }

    // Close sitemap
    sitemap += `</urlset>`;

    // Set proper headers for XML
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.send(sitemap);
  } catch (error: any) {
    logger.error('Error generating sitemap.xml:', error).catch(() => {});
    res.status(500).setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${res.locals.settings?.siteUrl || 'https://filmyfly.how'}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`);
  }
};

export const getMoviePage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { slug } = req.params;
    
    // Skip reserved paths - let them be handled by other routes
    const reservedPaths = ['admin', 'about', 'api', 'page-how-to-download-movie', 'search', 'site-1', 'site-privacy-policy', 'site-contact-us', 'site-about-us', 'site-dmca'];
    if (reservedPaths.includes(slug) || slug.startsWith('site-') || slug.startsWith('page-')) {
      return next(); // Pass to next middleware (404 handler)
    }
    
    // Fetch movie from database by slug with category
    const movie = await prisma.movie.findUnique({
      where: { slug: slug },
      include: {
        category: true
      }
    });

    if (!movie) {
      return next(); // Pass to 404 handler
    }

    // Fetch download redirect URL from settings
    let downloadRedirectUrl = 'https://kailashsur.in/top-investment-strategies-beginners/?redirect=';
    try {
      const setting = await prisma.setting.findUnique({
        where: { key: 'downloadRedirectUrl' }
      });
      if (setting && setting.value) {
        downloadRedirectUrl = setting.value;
      }
    } catch (error) {
      logger.warn('Settings table may not exist yet, using default URL').catch(() => {});
    }

    // Fetch 10 recent movies (excluding the current movie)
    const relatedMovies = await prisma.movie.findMany({
      where: {
        id: {
          not: movie.id
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        releaseYear: true
      }
    });

    // Generate long tag string for SEO
    const longTag = generateLongTag(movie);

    res.render('movie', {
      title: movie.title,
      movie: movie,
      downloadRedirectUrl: downloadRedirectUrl,
      relatedMovies: relatedMovies,
      longTag: longTag
    });
  } catch (error: any) {
    logger.error('Error fetching movie:', error).catch(() => {});
    return next(); // Pass to error handler
  }
};

