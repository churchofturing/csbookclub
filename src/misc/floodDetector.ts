import { Request, Response, NextFunction } from 'express';

type CustomHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
  errors: string[],
) => void | Promise<void>;

// Private state variables inside the module
let floodTimeMs = 0;
const lastPostTimes = new Map<string, number>();
let cleanupInterval: NodeJS.Timeout | null = null;

export function initFloodProtection(floodTimeMin: number, refreshFloodMap: number) {
  floodTimeMs = floodTimeMin * 60 * 1000;
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(
    () => {
      const now = Date.now();
      for (const [ip, lastPost] of lastPostTimes) {
        if (now - lastPost > floodTimeMs) {
          lastPostTimes.delete(ip);
        }
      }
    },
    refreshFloodMap * 60 * 1000,
  );
}

export function destroyFloodProtection() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  lastPostTimes.clear();
  floodTimeMs = 0;
}

export function setLastPostTime(req: Request) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const timestamp = Date.now();
  lastPostTimes.set(ip, timestamp);
}

export function getLastPostTime(ip: string): number | undefined {
  return lastPostTimes.get(ip);
}

export function isRateLimited(ip: string): boolean {
  const lastPost = lastPostTimes.get(ip);
  if (!lastPost) return false;
  return Date.now() - lastPost < floodTimeMs;
}

export function getRemainingWaitTime(ip: string): number {
  const lastPost = lastPostTimes.get(ip);
  if (!lastPost) return 0;
  const elapsed = Date.now() - lastPost;
  if (elapsed >= floodTimeMs) return 0;
  return Math.ceil((floodTimeMs - elapsed) / 1000 / 60);
}

export function precheckMiddleware(page: CustomHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';

    if (isRateLimited(ip)) {
      const remainingTime = getRemainingWaitTime(ip);
      return await page(req, res, next, [
        `Flood detected, post discarded. Try again in ${remainingTime} minutes.`,
      ]);
    }
    next();
  };
}
