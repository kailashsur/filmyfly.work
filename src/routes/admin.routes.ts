import { Router } from 'express';
import { verifyAdminToken, redirectIfAuthenticated } from '../middleware/auth.middleware.js';
import { getAdminDashboard, getAdminLogin, postAdminLogin, postAdminLogout, getSystemCheck } from '../controllers/admin.controller.js';
import { getSettings, postSettings } from '../controllers/settings.controller.js';
import {
  getStaticPageList,
  getAddStaticPage,
  postAddStaticPage,
  getEditStaticPage,
  postEditStaticPage,
  deleteStaticPage
} from '../controllers/static-page.controller.js';
import { getLogs, getLogsData, clearLogs, downloadLogs } from '../controllers/logs.controller.js';

const router = Router();

// Public admin routes (login/logout - no auth required)
router.get('/admin/login', redirectIfAuthenticated, getAdminLogin);
router.post('/admin/login', redirectIfAuthenticated, postAdminLogin);
router.post('/admin/logout', postAdminLogout);

// Protected admin routes - Authentication REQUIRED
router.get('/admin', verifyAdminToken, getAdminDashboard);
router.get('/admin/system-check', verifyAdminToken, getSystemCheck);
router.get('/admin/settings', verifyAdminToken, getSettings);
router.post('/admin/settings', verifyAdminToken, postSettings);

// Static Pages Management
router.get('/admin/static-pages', verifyAdminToken, getStaticPageList);
router.get('/admin/static-pages/add', verifyAdminToken, getAddStaticPage);
router.post('/admin/static-pages/add', verifyAdminToken, postAddStaticPage);
router.get('/admin/static-pages/edit/:id', verifyAdminToken, getEditStaticPage);
router.post('/admin/static-pages/edit/:id', verifyAdminToken, postEditStaticPage);
router.post('/admin/static-pages/delete/:id', verifyAdminToken, deleteStaticPage);

// Logs Management
router.get('/admin/logs', verifyAdminToken, getLogs);
router.get('/admin/logs/data', verifyAdminToken, getLogsData);
router.post('/admin/logs/clear', verifyAdminToken, clearLogs);
router.get('/admin/logs/download', verifyAdminToken, downloadLogs);

export default router;

