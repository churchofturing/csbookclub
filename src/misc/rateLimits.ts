import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import type { Request } from 'express';

// Global rate limit - applies to all requests
export const globalLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 300, // 300 requests per 10 per IP
  message: {
    error: 'Too many requests from this IP, please try again later',
    retryAfter: '10 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests to static assets
  skip: (req: Request): boolean => {
    return req.path.startsWith('/public') && req.method === 'GET';
  },
});

export const authLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 5 auth attempts per 15 minutes
  message: {
    error: '10 failed logins? What is going on mate. Try again in a bit.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

export const registerLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Only 3 account creations per day per IP
  message: {
    error: 'Account creation limit exceeded for this IP address',
    retryAfter: '24 hours',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
