import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { prisma } from '../lib/prisma.js';
import { generateSitemap } from '../utils/sitemap.generator.js';
import { logger } from '../utils/logger.js';

export const getStaticPageList = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pages = await prisma.staticPage.findMany({
      orderBy: { createdAt: 'desc' }
    });

    res.render('admin/static-pages/list', {
      title: 'Manage Static Pages',
      pages: pages,
      error: null,
      query: req.query
    });
  } catch (error: any) {
    logger.error('Error fetching static pages:', error).catch(() => {});
    res.render('admin/static-pages/list', {
      title: 'Manage Static Pages',
      pages: [],
      error: 'Failed to load static pages',
      query: req.query
    });
  }
};

export const getAddStaticPage = async (_req: AuthRequest, res: Response): Promise<void> => {
  res.render('admin/static-pages/add', {
    title: 'Add Static Page',
    page: null,
    error: null
  });
};

export const postAddStaticPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      isPublished
    } = req.body;

    // Validate required fields
    if (!title || !slug || !content) {
      res.render('admin/static-pages/add', {
        title: 'Add Static Page',
        page: req.body,
        error: 'Title, slug, and content are required'
      });
      return;
    }

    // Check if slug already exists
    const existingPage = await prisma.staticPage.findUnique({
      where: { slug }
    });

    if (existingPage) {
      res.render('admin/static-pages/add', {
        title: 'Add Static Page',
        page: req.body,
        error: 'A page with this slug already exists'
      });
      return;
    }

    // Create page
    await prisma.staticPage.create({
      data: {
        title,
        slug,
        content,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        isPublished: isPublished === 'on' || isPublished === true
      }
    });

    // Regenerate static sitemap.xml after adding static page
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/static-pages?success=Page created successfully');
  } catch (error: any) {
    logger.error('Error adding static page:', error).catch(() => {});
    res.render('admin/static-pages/add', {
      title: 'Add Static Page',
      page: req.body,
      error: error.message || 'Failed to create page'
    });
  }
};

export const getEditStaticPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const page = await prisma.staticPage.findUnique({
      where: { id }
    });

    if (!page) {
      res.status(404).render('error', {
        title: '404 - Not Found',
        message: 'Page not found',
        statusCode: 404
      });
      return;
    }

    res.render('admin/static-pages/edit', {
      title: 'Edit Static Page',
      page,
      error: null
    });
  } catch (error: any) {
    logger.error('Error fetching static page:', error).catch(() => {});
    res.status(500).render('admin/static-pages/edit', {
      title: 'Edit Static Page',
      page: null,
      error: 'Failed to load page details'
    });
  }
};

export const postEditStaticPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      slug,
      content,
      metaTitle,
      metaDescription,
      metaKeywords,
      isPublished
    } = req.body;

    // Validate required fields
    if (!title || !slug || !content) {
      const page = await prisma.staticPage.findUnique({ where: { id } });
      res.render('admin/static-pages/edit', {
        title: 'Edit Static Page',
        page: { ...page, ...req.body },
        error: 'Title, slug, and content are required'
      });
      return;
    }

    // Check if slug is taken by another page
    const existingPage = await prisma.staticPage.findFirst({
      where: {
        slug,
        NOT: { id }
      }
    });

    if (existingPage) {
      const page = await prisma.staticPage.findUnique({ where: { id } });
      res.render('admin/static-pages/edit', {
        title: 'Edit Static Page',
        page: { ...page, ...req.body },
        error: 'A page with this slug already exists'
      });
      return;
    }

    // Update page
    await prisma.staticPage.update({
      where: { id },
      data: {
        title,
        slug,
        content,
        metaTitle: metaTitle || null,
        metaDescription: metaDescription || null,
        metaKeywords: metaKeywords || null,
        isPublished: isPublished === 'on' || isPublished === true
      }
    });

    // Regenerate static sitemap.xml after updating static page
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/static-pages?success=Page updated successfully');
  } catch (error: any) {
    logger.error('Error updating static page:', error).catch(() => {});
    const page = await prisma.staticPage.findUnique({ where: { id: parseInt(req.params.id) } });
    res.render('admin/static-pages/edit', {
      title: 'Edit Static Page',
      page: { ...page, ...req.body },
      error: error.message || 'Failed to update page'
    });
  }
};

export const deleteStaticPage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    await prisma.staticPage.delete({
      where: { id }
    });

    // Regenerate static sitemap.xml after deleting static page
    generateSitemap(prisma).catch(async (err) => await logger.error('Error regenerating sitemap:', err));

    res.redirect('/admin/static-pages?success=Page deleted successfully');
  } catch (error: any) {
    logger.error('Error deleting static page:', error).catch(() => {});
    res.redirect('/admin/static-pages?error=Failed to delete page');
  }
};

export const getPublicStaticPage = async (req: Request, res: Response, next: any): Promise<void> => {
  try {
    const { slug } = req.params;

    // slug comes from /site-:slug route, so it's already the page slug
    const page = await prisma.staticPage.findUnique({
      where: { slug: slug }
    });

    if (!page || !page.isPublished) {
      return next(); // Pass to 404 handler
    }

    res.render('static-page', {
      title: page.metaTitle || page.title,
      page: page,
      metaDescription: page.metaDescription,
      metaKeywords: page.metaKeywords
    });
  } catch (error: any) {
    logger.error('Error fetching static page:', error).catch(() => {});
    return next(); // Pass to error handler
  }
};

