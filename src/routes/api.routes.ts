import { Router } from 'express';
import * as apiController from '../controllers/api.controller.js';

const router = Router();

/**
 * Public API Routes for Astro Frontend
 * All routes return JSON responses
 */

// Homepage data (trending + recent + categories)
router.get('/api/home', apiController.getHomePageData);

// Movies
router.get('/api/movies', apiController.getMovies);
router.get('/api/movies/trending', apiController.getTrendingMovies);
router.get('/api/movies/:slug', apiController.getMovieBySlug);

// Categories
router.get('/api/categories', apiController.getCategories);
router.get('/api/categories/:slug', apiController.getCategoryBySlug);

// Search
router.get('/api/search', apiController.searchMovies);

// Static pages
router.get('/api/static-pages/:slug', apiController.getStaticPageBySlug);

// Astro Settings (public only) - renamed from /api/settings
router.get('/api/astro-settings', apiController.getAstroSettings);

export default router;
