import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const SEARCH_RESULTS_PER_PAGE = 20;

export const getSearchResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query['to-search'] as string || req.query.q as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * SEARCH_RESULTS_PER_PAGE;

    if (!searchQuery || searchQuery.trim() === '') {
      res.render('search', {
        title: 'Search Movies',
        query: '',
        movies: [],
        currentPage: 1,
        totalPages: 0,
        totalResults: 0,
        hasNextPage: false,
        hasPrevPage: false,
        error: null
      });
      return;
    }

    const trimmedQuery = searchQuery.trim();

    // Count total results
    const totalResults = await prisma.movie.count({
      where: {
        OR: [
          { title: { contains: trimmedQuery, mode: 'insensitive' } },
          { description: { contains: trimmedQuery, mode: 'insensitive' } },
          { keywords: { contains: trimmedQuery, mode: 'insensitive' } },
          { genre: { contains: trimmedQuery, mode: 'insensitive' } },
          { cast: { contains: trimmedQuery, mode: 'insensitive' } },
          { slug: { contains: trimmedQuery, mode: 'insensitive' } }
        ]
      }
    });

    const totalPages = Math.ceil(totalResults / SEARCH_RESULTS_PER_PAGE);

    // Fetch paginated results
    const movies = await prisma.movie.findMany({
      where: {
        OR: [
          { title: { contains: trimmedQuery, mode: 'insensitive' } },
          { description: { contains: trimmedQuery, mode: 'insensitive' } },
          { keywords: { contains: trimmedQuery, mode: 'insensitive' } },
          { genre: { contains: trimmedQuery, mode: 'insensitive' } },
          { cast: { contains: trimmedQuery, mode: 'insensitive' } },
          { slug: { contains: trimmedQuery, mode: 'insensitive' } }
        ]
      },
      skip: skip,
      take: SEARCH_RESULTS_PER_PAGE,
      orderBy: {
        createdAt: 'desc'
      },
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
    });

    res.render('search', {
      title: `Search Results for "${trimmedQuery}"`,
      query: trimmedQuery,
      movies: movies,
      currentPage: page,
      totalPages: totalPages,
      totalResults: totalResults,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      error: null
    });
  } catch (error: any) {
    logger.error('Error searching movies:', error).catch(() => {});
    res.render('search', {
      title: 'Search Movies',
      query: req.query['to-search'] as string || req.query.q as string || '',
      movies: [],
      currentPage: 1,
      totalPages: 0,
      totalResults: 0,
      hasNextPage: false,
      hasPrevPage: false,
      error: 'An error occurred while searching. Please try again.'
    });
  }
};

