// Type definitions for the application

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Extend Express Session type
declare module 'express-session' {
  interface SessionData {
    adminUser?: {
      uid: string;
      email?: string;
      name?: string;
      [key: string]: any;
    };
  }
}

