import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const ITEMS_PER_PAGE = 20;

export const getCategoryPage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const skip = (page - 1) * ITEMS_PER_PAGE;

    // Find category by id or slug
    const category = await prisma.category.findFirst({
      where: {
        OR: [
          { id: parseInt(id) },
          { slug: slug }
        ]
      }
    });

    if (!category) {
      res.status(404).render('error', {
        title: '404 - Category Not Found',
        message: 'The category you are looking for does not exist.',
        statusCode: 404
      });
      return;
    }

    // Get total count of movies in this category
    const totalMovies = await prisma.movie.count({
      where: { categoryId: category.id }
    });

    const totalPages = Math.ceil(totalMovies / ITEMS_PER_PAGE);

    // Get movies in this category with pagination
    const movies = await prisma.movie.findMany({
      where: { categoryId: category.id },
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        title: true,
        slug: true,
        thumbnail: true,
        keywords: true,
        releaseYear: true,
        genre: true
      }
    });

    res.render('category', {
      title: category.name,
      category: category,
      movies: movies,
      currentPage: page,
      totalPages,
      totalMovies,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    });
  } catch (error: any) {
    logger.error('Error fetching category:', error).catch(() => {});
    res.status(500).render('error', {
      title: '500 - Server Error',
      message: 'Failed to load category',
      statusCode: 500
    });
  }
};

export const getAllCategories = async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { movies: true }
        }
      }
    });

    res.json(categories);
  } catch (error: any) {
    logger.error('Error fetching categories:', error).catch(() => {});
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
