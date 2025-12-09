import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import routes from "./routes/index.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import movieRoutes from "./routes/movie.routes.js";
import { errorHandler } from './middleware/error.middleware.js';
import { prisma } from './lib/prisma.js';
import { generateSitemap } from './utils/sitemap.generator.js';
import { logger } from './utils/logger.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: Application = express();
const PORT = process.env.PORT || 3000;

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware to load settings and make them available to all views
app.use(async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });
    
    const settingsObj: Record<string, string> = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    
    // Make settings available to all views
    res.locals.settings = settingsObj;
    next();
  } catch (error) {
    // If settings table doesn't exist or error occurs, continue without settings
    res.locals.settings = {};
    next();
  }
});

// Routes
// Admin routes (authentication required for /admin/* except login/logout)
// Must be registered BEFORE catch-all routes to avoid conflicts
app.use('/', adminRoutes);
app.use('/', movieRoutes);

// Public routes (no authentication)
// This includes catch-all /:slug route, so it must be last
app.use('/', routes);

// 404 handler
app.use((_req: Request, res: Response, _next: NextFunction) => {
  res.status(404).render('error', {
    title: '404 - Page Not Found',
    message: 'The page you are looking for does not exist.',
    statusCode: 404
  });
});

// Error handler
app.use(errorHandler);

// Generate initial sitemap on startup
generateSitemap(prisma).catch(async (err) => {
  await logger.warn('Could not generate initial sitemap:', err.message);
});

// Start server
app.listen(PORT, async () => {
  await logger.info(`Server is running on http://localhost:${PORT}`);
});

export default app;

