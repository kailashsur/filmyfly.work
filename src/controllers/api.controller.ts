import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

// Constants
const ITEMS_PER_PAGE = 20;

/**
 * GET /api/movies
 * Get paginated list of movies
 */
export const getMovies = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || ITEMS_PER_PAGE;
        const skip = (page - 1) * limit;

        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    keywords: true,
                    releaseYear: true,
                    genre: true,
                    createdAt: true
                }
            }),
            prisma.movie.count()
        ]);

        res.json({
            success: true,
            data: movies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        });
    } catch (error: any) {
        logger.error('API Error - getMovies:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch movies'
        });
    }
};

/**
 * GET /api/movies/trending
 * Get trending movies
 */
export const getTrendingMovies = async (_req: Request, res: Response): Promise<void> => {
    try {
        const trendingMoviesData = await prisma.trendingMovie.findMany({
            orderBy: { order: 'asc' },
            include: {
                movie: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        thumbnail: true,
                        keywords: true,
                        releaseYear: true,
                        genre: true
                    }
                }
            }
        });

        const trendingMovies = trendingMoviesData
            .map(tm => tm.movie)
            .filter(m => m !== null);

        res.json({
            success: true,
            data: trendingMovies
        });
    } catch (error: any) {
        logger.error('API Error - getTrendingMovies:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trending movies'
        });
    }
};

/**
 * GET /api/movies/:slug
 * Get single movie by slug
 */
export const getMovieBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;

        const movie = await prisma.movie.findUnique({
            where: { slug },
            include: {
                category: true,
                TrendingMovie: true
            }
        });

        if (!movie) {
            res.status(404).json({
                success: false,
                error: 'Movie not found'
            });
            return;
        }

        // Get related movies (same category or recent)
        const relatedMovies = await prisma.movie.findMany({
            where: {
                id: { not: movie.id },
                ...(movie.categoryId && { categoryId: movie.categoryId })
            },
            take: 10,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                slug: true,
                thumbnail: true,
                releaseYear: true,
                genre: true
            }
        });

        // Get download redirect URL from settings
        let downloadRedirectUrl = '';
        try {
            const setting = await prisma.setting.findUnique({
                where: { key: 'downloadRedirectUrl' }
            });
            if (setting?.value) {
                downloadRedirectUrl = setting.value;
            }
        } catch (error) {
            logger.warn('Could not fetch downloadRedirectUrl setting').catch(() => { });
        }

        res.json({
            success: true,
            data: {
                movie,
                relatedMovies,
                downloadRedirectUrl
            }
        });
    } catch (error: any) {
        logger.error('API Error - getMovieBySlug:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch movie'
        });
    }
};

/**
 * GET /api/categories
 * Get all categories with movie counts
 */
export const getCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { movies: true }
                }
            }
        });

        res.json({
            success: true,
            data: categories
        });
    } catch (error: any) {
        logger.error('API Error - getCategories:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch categories'
        });
    }
};

/**
 * GET /api/categories/:slug
 * Get category by slug with movies
 */
export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || ITEMS_PER_PAGE;
        const skip = (page - 1) * limit;

        // Find category by slug
        const category = await prisma.category.findUnique({
            where: { slug }
        });

        if (!category) {
            res.status(404).json({
                success: false,
                error: 'Category not found'
            });
            return;
        }

        // Get movies in this category
        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where: { categoryId: category.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    keywords: true,
                    releaseYear: true,
                    genre: true
                }
            }),
            prisma.movie.count({
                where: { categoryId: category.id }
            })
        ]);

        res.json({
            success: true,
            data: {
                category,
                movies,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error: any) {
        logger.error('API Error - getCategoryBySlug:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch category'
        });
    }
};

/**
 * GET /api/search
 * Search movies
 */
export const searchMovies = async (req: Request, res: Response): Promise<void> => {
    try {
        console.log('Search API called with query:', req.query);
        const query = (req.query.q as string || req.query['to-search'] as string || '').trim();
        console.log('Parsed query string:', query);

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || ITEMS_PER_PAGE;
        const skip = (page - 1) * limit;

        if (!query) {
            console.log('Empty query, returning empty results');
            res.json({
                success: true,
                data: {
                    query: '',
                    movies: [],
                    pagination: {
                        page: 1,
                        limit,
                        total: 0,
                        totalPages: 0,
                        hasNextPage: false,
                        hasPrevPage: false
                    }
                }
            });
            return;
        }

        const searchCondition = {
            OR: [
                { title: { contains: query, mode: 'insensitive' as const } },
                { description: { contains: query, mode: 'insensitive' as const } },
                { keywords: { contains: query, mode: 'insensitive' as const } },
                { genre: { contains: query, mode: 'insensitive' as const } },
                { cast: { contains: query, mode: 'insensitive' as const } }
            ]
        };

        const [movies, total] = await Promise.all([
            prisma.movie.findMany({
                where: searchCondition,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    description: true,
                    releaseYear: true,
                    genre: true,
                    keywords: true
                }
            }),
            prisma.movie.count({ where: searchCondition })
        ]);

        res.json({
            success: true,
            data: {
                query,
                movies,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error: any) {
        logger.error('API Error - searchMovies:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to search movies'
        });
    }
};

/**
 * GET /api/static-pages/:slug
 * Get static page by slug
 */
export const getStaticPageBySlug = async (req: Request, res: Response): Promise<void> => {
    try {
        const { slug } = req.params;

        const page = await prisma.staticPage.findUnique({
            where: { slug: `${slug}.html`, isPublished: true }
        });

        if (!page) {
            res.status(404).json({
                success: false,
                error: 'Page not found'
            });
            return;
        }

        res.json({
            success: true,
            data: page
        });
    } catch (error: any) {
        logger.error('API Error - getStaticPageBySlug:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch page'
        });
    }
};

/**
 * GET /api/astro-settings
 * Get public Astro settings
 */
export const getAstroSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
        const settings = await prisma.astroSetting.findMany({
            select: {
                key: true,
                value: true
            }
        });

        // Convert to key-value object
        const settingsObj: Record<string, string> = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        res.json({
            success: true,
            data: settingsObj
        });
    } catch (error: any) {
        logger.error('API Error - getAstroSettings:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch Astro settings'
        });
    }
};

/**
 * GET /api/home
 * Get homepage data (trending + recent movies + categories)
 */
export const getHomePageData = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = 50; // Match the original 50 movies per page
        const skip = (page - 1) * limit;

        const [trendingMoviesData, recentMovies, categories, total] = await Promise.all([
            // Trending movies
            prisma.trendingMovie.findMany({
                orderBy: { order: 'asc' },
                include: {
                    movie: {
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            thumbnail: true,
                            keywords: true,
                            releaseYear: true,
                            genre: true
                        }
                    }
                }
            }),
            // Recent movies
            prisma.movie.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    slug: true,
                    thumbnail: true,
                    keywords: true,
                    releaseYear: true,
                    genre: true
                }
            }),
            // Categories
            prisma.category.findMany({
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: { movies: true }
                    }
                }
            }),
            // Total count
            prisma.movie.count()
        ]);

        const trendingMovies = trendingMoviesData
            .map(tm => tm.movie)
            .filter(m => m !== null);

        res.json({
            success: true,
            data: {
                trendingMovies,
                recentMovies,
                categories,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNextPage: page < Math.ceil(total / limit),
                    hasPrevPage: page > 1
                }
            }
        });
    } catch (error: any) {
        logger.error('API Error - getHomePageData:', error).catch(() => { });
        res.status(500).json({
            success: false,
            error: 'Failed to fetch homepage data'
        });
    }
};
