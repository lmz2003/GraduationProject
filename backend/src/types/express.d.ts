import { Request } from 'express';

// Extend Express Request type to include user property
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      phoneNumber: string;
      name?: string;
      avatar?: string;
    };
  }
}
