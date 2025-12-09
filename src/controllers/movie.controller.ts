import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { generateSitemap } from '../utils/sitemap.generator.js';
import { logger } from '../utils/logger.js';

const ITEMS_PER_PAGE = 10;

export const getMovieList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Get total count for pagination with timeout handling
    const totalMovies = await Promise.race([
      prisma.movie.count(),
      new Promise<number>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as number;
    
    const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

    // Get all trending movies with their details
    let trendingMoviesData: any[] = [];
    let trendingMovies: any[] = [];
    
    try {
      trendingMoviesData = await prisma.trendingMovie.findMany({
        include: {
          movie: true
        },
        orderBy: {
          order: 'asc'
        }
      });
      trendingMovies = trendingMoviesData.map(tm => tm.movie).filter(m => m !== null);
    } catch (error) {
      logger.error('Error fetching trending movies:', error).catch(() => {});
      trendingMovies = [];
      trendingMoviesData = [];
    }

    // Get all trending movie IDs for quick lookup
    const trendingMovieIds = new Set(trendingMoviesData.map(tm => tm.movieId));

    // Get movies with pagination
    const movies = await Promise.race([
      prisma.movie.findMany({
        skip,
        take: ITEMS_PER_PAGE,
        orderBy: {
          createdAt: 'desc'
        }
      }),
      new Promise<any[]>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      )
    ]) as any[];

    // Mark movies as trending
    const moviesWithTrending = movies.map(movie => ({
      ...movie,
      isTrending: trendingMovieIds.has(movie.id)
    }));

    res.render('admin/movies/list', {
      title: 'Manage Movies',
      trendingMovies: trendingMovies,
      trendingMoviesData: trendingMoviesData,
      movies: moviesWithTrending,
      currentPage: page,
      totalPages,
      totalMovies,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      query: req.query
    });
  } catch (error: any) {
    logger.error('Error fetching movies:', error).catch(() => {});
    
    // Check if it's a database connection error
    if (error.code === 'P1008' || error.message?.includes('timeout') || error.message?.includes('ECONNREFUSED')) {
      res.status(503).render('error', {
        title: '503 - Service Unavailable',
        message: 'Database connection failed. Please check your database configuration.',
        statusCode: 503
      });
    } else {
      res.status(500).render('error', {
        title: '500 - Server Error',
        message: 'Failed to load movies',
        statusCode: 500
      });
    }
  }
};

export const getAddMovie = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Try to fetch categories, but don't fail if table doesn't exist yet
    let categories: any[] = [];
    try {
      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (categoryError: any) {
      logger.warn('Categories table may not exist yet. Run migration first:', categoryError.message).catch(() => {});
      // Continue with empty categories array
      categories = [];
    }
    
    res.render('admin/movies/add', {
      title: 'Add Movie',
      movie: null,
      categories: categories,
      error: null
    });
  } catch (error: any) {
    logger.error('Error in getAddMovie:', error).catch(() => {});
    res.render('admin/movies/add', {
      title: 'Add Movie',
      movie: null,
      categories: [],
      error: null
    });
  }
};

export const postAddMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      description,
      thumbnail,
      genre,
      languages,
      duration,
      releaseYear,
      cast,
      sizes,
      downloadUrl,
      screenshot,
      keywords,
      categoryId
    } = req.body;

    // Validate required fields
    if (!title || !slug) {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      res.render('admin/movies/add', {
        title: 'Add Movie',
        movie: req.body,
        categories: categories,
        error: 'Title and slug are required'
      });
      return;
    }

    // Check if slug already exists
    const existingMovie = await prisma.movie.findUnique({
      where: { slug }
    });

    if (existingMovie) {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      res.render('admin/movies/add', {
        title: 'Add Movie',
        movie: req.body,
        categories: categories,
        error: 'A movie with this slug already exists'
      });
      return;
    }

    // Create movie
    await prisma.movie.create({
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        genre: genre || null,
        languages: languages || null,
        duration: duration || null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        cast: cast || null,
        sizes: sizes || null,
        downloadUrl: downloadUrl || null,
        screenshot: screenshot || null,
        keywords: keywords || null,
        categoryId: categoryId ? parseInt(categoryId) : null
      }
    });

    // Regenerate static sitemap.xml after adding movie
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/movies?success=Movie added successfully');
  } catch (error: any) {
    logger.error('Error adding movie:', error).catch(() => {});
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.render('admin/movies/add', {
      title: 'Add Movie',
      movie: req.body,
      categories: categories,
      error: error.message || 'Failed to add movie'
    });
  }
};

export const getEditMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const movie = await prisma.movie.findUnique({
      where: { id }
    });

    if (!movie) {
      res.status(404).render('error', {
        title: '404 - Not Found',
        message: 'Movie not found',
        statusCode: 404
      });
      return;
    }

    // Try to fetch categories, but don't fail if table doesn't exist yet
    let categories: any[] = [];
    try {
      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
    } catch (categoryError: any) {
      logger.warn('Categories table may not exist yet. Run migration first:', categoryError.message).catch(() => {});
      // Continue with empty categories array
      categories = [];
    }

    res.render('admin/movies/edit', {
      title: 'Edit Movie',
      movie,
      categories: categories,
      error: null
    });
  } catch (error: any) {
    logger.error('Error fetching movie:', error).catch(() => {});
    res.status(500).render('error', {
      title: '500 - Server Error',
      message: 'Failed to load movie: ' + (error.message || 'Unknown error'),
      statusCode: 500
    });
  }
};

export const postEditMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      slug,
      description,
      thumbnail,
      genre,
      languages,
      duration,
      releaseYear,
      cast,
      sizes,
      downloadUrl,
      screenshot,
      keywords,
      categoryId
    } = req.body;

    // Validate required fields
    if (!title || !slug) {
      const movie = await prisma.movie.findUnique({ where: { id } });
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      res.render('admin/movies/edit', {
        title: 'Edit Movie',
        movie: { ...movie, ...req.body },
        categories: categories,
        error: 'Title and slug are required'
      });
      return;
    }

    // Check if slug is taken by another movie
    const existingMovie = await prisma.movie.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    });

    if (existingMovie) {
      const movie = await prisma.movie.findUnique({ where: { id } });
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' }
      });
      res.render('admin/movies/edit', {
        title: 'Edit Movie',
        movie: { ...movie, ...req.body },
        categories: categories,
        error: 'A movie with this slug already exists'
      });
      return;
    }

    // Update movie
    await prisma.movie.update({
      where: { id },
      data: {
        title,
        slug,
        description: description || null,
        thumbnail: thumbnail || null,
        genre: genre || null,
        languages: languages || null,
        duration: duration || null,
        releaseYear: releaseYear ? parseInt(releaseYear) : null,
        cast: cast || null,
        sizes: sizes || null,
        downloadUrl: downloadUrl || null,
        screenshot: screenshot || null,
        keywords: keywords || null,
        categoryId: categoryId ? parseInt(categoryId) : null
      }
    });

    // Regenerate static sitemap.xml after updating movie
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/movies?success=Movie updated successfully');
  } catch (error: any) {
    logger.error('Error updating movie:', error).catch(() => {});
    const movie = await prisma.movie.findUnique({ where: { id: parseInt(req.params.id) } });
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    res.render('admin/movies/edit', {
      title: 'Edit Movie',
      movie: { ...movie, ...req.body },
      categories: categories,
      error: error.message || 'Failed to update movie'
    });
  }
};

export const deleteMovie = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    await prisma.movie.delete({
      where: { id }
    });

    // Regenerate static sitemap.xml after deleting movie
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/movies?success=Movie deleted successfully');
  } catch (error) {
    logger.error('Error deleting movie:', error).catch(() => {});
    res.redirect('/admin/movies?error=Failed to delete movie');
  }
};

export const getBulkAddMovies = (_req: AuthRequest, res: Response): void => {
  res.render('admin/movies/bulk-add', {
    title: 'Bulk Add Movies',
    error: null,
    success: null,
    results: null
  });
};

export const postBulkAddMovies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { moviesData } = req.body;
    
    if (!moviesData) {
      res.render('admin/movies/bulk-add', {
        title: 'Bulk Add Movies',
        error: 'No movie data provided',
        success: null,
        results: null
      });
      return;
    }

    let movies: any[];
    
    // Try to parse as JSON if it's a string
    if (typeof moviesData === 'string') {
      try {
        movies = JSON.parse(moviesData);
      } catch (parseError) {
        // If JSON parse fails, try CSV parsing
        movies = parseCSV(moviesData);
      }
    } else if (Array.isArray(moviesData)) {
      movies = moviesData;
    } else {
      res.render('admin/movies/bulk-add', {
        title: 'Bulk Add Movies',
        error: 'Invalid data format. Expected JSON array or CSV.',
        success: null,
        results: null
      });
      return;
    }

    if (!Array.isArray(movies) || movies.length === 0) {
      res.render('admin/movies/bulk-add', {
        title: 'Bulk Add Movies',
        error: 'No valid movies found in the data',
        success: null,
        results: null
      });
      return;
    }

    const results = {
      total: movies.length,
      success: 0,
      failed: 0,
      errors: [] as Array<{ index: number; title: string; error: string }>
    };

    // Process each movie
    for (let i = 0; i < movies.length; i++) {
      const movieData = movies[i];
      
      try {
        // Validate required fields
        if (!movieData.title || !movieData.slug) {
          results.failed++;
          results.errors.push({
            index: i + 1,
            title: movieData.title || 'Unknown',
            error: 'Title and slug are required'
          });
          continue;
        }

        // Check if slug already exists
        const existingMovie = await prisma.movie.findUnique({
          where: { slug: movieData.slug }
        });

        if (existingMovie) {
          results.failed++;
          results.errors.push({
            index: i + 1,
            title: movieData.title,
            error: `Slug "${movieData.slug}" already exists`
          });
          continue;
        }

        // Create movie
        await prisma.movie.create({
          data: {
            title: movieData.title,
            slug: movieData.slug,
            description: movieData.description || null,
            thumbnail: movieData.thumbnail || null,
            genre: movieData.genre || null,
            languages: movieData.languages || null,
            duration: movieData.duration || null,
            releaseYear: movieData.releaseYear ? parseInt(movieData.releaseYear) : null,
            cast: movieData.cast || null,
            sizes: movieData.sizes || null,
            downloadUrl: movieData.downloadUrl || null,
            screenshot: movieData.screenshot || null,
            keywords: movieData.keywords || null,
            categoryId: movieData.categoryId ? parseInt(movieData.categoryId) : null
          }
        });

        results.success++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          index: i + 1,
          title: movieData.title || 'Unknown',
          error: error.message || 'Unknown error'
        });
      }
    }

    // Regenerate static sitemap.xml after bulk add (only if at least one movie was added)
    if (results.success > 0) {
      generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));
    }

    res.render('admin/movies/bulk-add', {
      title: 'Bulk Add Movies',
      error: results.failed > 0 ? `${results.failed} movie(s) failed to import` : null,
      success: results.success > 0 ? `${results.success} movie(s) added successfully` : null,
      results
    });
  } catch (error: any) {
    logger.error('Error in bulk add:', error).catch(() => {});
    res.render('admin/movies/bulk-add', {
      title: 'Bulk Add Movies',
      error: error.message || 'Failed to process bulk import',
      success: null,
      results: null
    });
  }
};

// Helper function to parse CSV
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  // Parse data rows
  const movies = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    if (values.length !== headers.length) continue;

    const movie: any = {};
    headers.forEach((header, index) => {
      const key = header.toLowerCase().replace(/\s+/g, '');
      movie[key] = values[index] || '';
    });

    // Map common CSV column names to our schema
    const mappedMovie: any = {
      title: movie.title || movie.name || '',
      slug: movie.slug || generateSlug(movie.title || movie.name || ''),
      description: movie.description || movie.desc || '',
      thumbnail: movie.thumbnail || movie.image || '',
      genre: movie.genre || movie.category || '',
      languages: movie.languages || movie.language || '',
      duration: movie.duration || movie.runtime || '',
      releaseYear: movie.releaseyear || movie.year || movie['release-year'] || '',
      cast: movie.cast || movie.actors || '',
      sizes: movie.sizes || movie.quality || '',
      downloadUrl: movie.downloadurl || movie.url || movie.link || '',
      screenshot: movie.screenshot || movie.poster || '',
      keywords: movie.keywords || movie.tags || ''
    };

    if (mappedMovie.title) {
      movies.push(mappedMovie);
    }
  }

  return movies;
}

// Helper function to generate slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export const addToTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movieId = parseInt(req.params.id);

    // Check if movie exists
    const movie = await prisma.movie.findUnique({
      where: { id: movieId }
    });

    if (!movie) {
      res.redirect('/admin/movies?error=Movie not found');
      return;
    }

    // Check if already in trending
    const existing = await prisma.trendingMovie.findUnique({
      where: { movieId }
    });

    if (existing) {
      res.redirect('/admin/movies?error=Movie is already in trending');
      return;
    }

    // Get current max order
    const maxOrder = await prisma.trendingMovie.findFirst({
      orderBy: { order: 'desc' }
    });

    // Add to trending
    await prisma.trendingMovie.create({
      data: {
        movieId,
        order: maxOrder ? maxOrder.order + 1 : 0
      }
    });

    // Regenerate static sitemap.xml (homepage includes trending movies)
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/movies?success=Movie added to trending');
  } catch (error: any) {
    logger.error('Error adding to trending:', error).catch(() => {});
    res.redirect('/admin/movies?error=Failed to add movie to trending');
  }
};

export const removeFromTrending = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const movieId = parseInt(req.params.id);

    // Remove from trending
    await prisma.trendingMovie.deleteMany({
      where: { movieId }
    });

    // Regenerate static sitemap.xml (homepage includes trending movies)
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/movies?success=Movie removed from trending');
  } catch (error: any) {
    logger.error('Error removing from trending:', error).catch(() => {});
    res.redirect('/admin/movies?error=Failed to remove movie from trending');
  }
};

export const getMoviesByCategory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const selectedCategoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : null;
    const page = parseInt(req.query.page as string) || 1;
    const ITEMS_PER_PAGE = 20;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Fetch all categories for dropdown
    let categories: any[] = [];
    try {
      categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { movies: true }
          }
        }
      });
    } catch (categoryError: any) {
      logger.warn('Categories table may not exist yet:', categoryError.message).catch(() => {});
      categories = [];
    }

    let selectedCategory = null;
    let movies: any[] = [];
    let totalMovies = 0;
    let totalPages = 0;

    // If a category is selected, fetch movies for that category
    if (selectedCategoryId) {
      selectedCategory = categories.find(cat => cat.id === selectedCategoryId);
      
      if (selectedCategory) {
        totalMovies = await prisma.movie.count({
          where: { categoryId: selectedCategoryId }
        });

        totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

        movies = await prisma.movie.findMany({
          where: { categoryId: selectedCategoryId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: ITEMS_PER_PAGE,
          select: {
            id: true,
            title: true,
            slug: true,
            thumbnail: true,
            releaseYear: true,
            createdAt: true
          }
        });
      }
    }

    res.render('admin/movies/by-category', {
      title: 'Movies by Category',
      categories: categories,
      selectedCategory: selectedCategory,
      selectedCategoryId: selectedCategoryId,
      movies: movies,
      totalMovies: totalMovies,
      currentPage: page,
      totalPages: totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      error: null
    });
  } catch (error: any) {
    logger.error('Error fetching movies by category:', error).catch(() => {});
    
    // If categories table doesn't exist, show empty state
    if (error.code === 'P2021' || error.message?.includes('does not exist')) {
      res.render('admin/movies/by-category', {
        title: 'Movies by Category',
        categories: [],
        selectedCategory: null,
        selectedCategoryId: null,
        movies: [],
        totalMovies: 0,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        error: 'Categories table does not exist. Please run migration first.'
      });
      return;
    }

    res.status(500).render('error', {
      title: '500 - Server Error',
      message: 'Failed to load movies by category: ' + (error.message || 'Unknown error'),
      statusCode: 500
    });
  }
};

