import { Request } from 'express';

// Extend Express Request type to include user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      githubId: string;
      githubUsername?: string;
      name?: string;
      avatar?: string;
      email?: string;
    };
  }
}