import { Router } from 'express';
import { getHomePage, getAboutPage, getMoviePage, getHowToDownloadPage, getRobotsTxt } from '../controllers/index.controller.js';
import { getCategoryPage } from '../controllers/category.controller.js';
import { getPublicStaticPage } from '../controllers/static-page.controller.js';
import { getSearchResults } from '../controllers/search.controller.js';

const router = Router();

// Public routes - NO authentication required
// SEO routes - must be before catch-all routes
router.get('/robots.txt', getRobotsTxt);
// Note: sitemap.xml is now a static file in public/ directory, served automatically by express.static

// Home route
router.get('/', getHomePage);

// About route
router.get('/about', getAboutPage);

// How to Download Movies page
router.get('/page-how-to-download-movie', getHowToDownloadPage);

// Search route - must be before catch-all /:slug
router.get('/site-1', getSearchResults);
router.get('/search', getSearchResults);

// Category page route - must be before catch-all /:slug
router.get('/page-cat/:id/:slug', getCategoryPage);

// Static pages route - must be before catch-all /:slug
// Pattern: /site-privacy-policy, /site-contact-us, etc.
router.get('/site-:slug', getPublicStaticPage);

// Single movie page - must be after other routes to avoid conflicts
router.get('/:slug', getMoviePage);

export default router;

