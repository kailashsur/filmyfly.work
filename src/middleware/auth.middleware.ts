import { Request, Response, NextFunction } from 'express';
import admin from '../config/firebase.js';
import { logger } from '../utils/logger.js';

export interface AuthRequest extends Request {
  user?: admin.auth.DecodedIdToken | any;
}

/**
 * Middleware to verify Firebase ID token for admin routes
 */
export const verifyAdminToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is already authenticated via session
    if (req.session?.adminUser) {
      req.user = req.session.adminUser as any;
      return next();
    }

    // Get token from Authorization header or cookie
    const token = req.headers.authorization?.split('Bearer ')[1] || req.cookies?.adminToken;

    if (!token) {
      res.redirect('/admin/login');
      return;
    }

    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Store in session for future requests
    req.session!.adminUser = decodedToken;
    req.user = decodedToken;

    next();
  } catch (error: any) {
    // Clear expired/invalid tokens from cookies and session
    res.clearCookie('adminToken');
    if (req.session) {
      req.session.adminUser = undefined;
    }

    // Only log non-expired token errors to avoid spam
    if (error?.code !== 'auth/id-token-expired') {
      logger.error('Token verification error:', error).catch(() => {});
    }

    res.redirect('/admin/login');
  }
};

/**
 * Middleware to check if user is already logged in (redirect to dashboard if logged in)
 */
export const redirectIfAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.session?.adminUser) {
    res.redirect('/admin');
    return;
  }
  next();
};

