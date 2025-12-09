import { Router } from 'express';
// import { verifyAdminToken } from '../middleware/auth.middleware.js';
import {
  getMovieList,
  getAddMovie,
  postAddMovie,
  getEditMovie,
  postEditMovie,
  deleteMovie,
  getBulkAddMovies,
  postBulkAddMovies,
  addToTrending,
  removeFromTrending,
  getMoviesByCategory
} from '../controllers/movie.controller.js';

const router = Router();

// All /admin/movies/* routes require admin authentication
// router.use(verifyAdminToken);

// Movie list with pagination
router.get('/admin/movies', getMovieList);

// Add movie
router.get('/admin/movies/add', getAddMovie);
router.post('/admin/movies/add', postAddMovie);

// Edit movie
router.get('/admin/movies/edit/:id', getEditMovie);
router.post('/admin/movies/edit/:id', postEditMovie);

// Delete movie
router.post('/admin/movies/delete/:id', deleteMovie);

// Bulk add movies
router.get('/admin/movies/bulk-add', getBulkAddMovies);
router.post('/admin/movies/bulk-add', postBulkAddMovies);

// Trending movies
router.post('/admin/movies/trending/add/:id', addToTrending);
router.post('/admin/movies/trending/remove/:id', removeFromTrending);

// Movies by category
router.get('/admin/movies/by-category', getMoviesByCategory);

export default router;

