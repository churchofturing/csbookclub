// express.d.ts
import * as express from 'express';

declare global {
  var markdown: MarkdownIt | undefined;
  namespace Express {
    interface Request {
      startTime?: number;
    }
  }
}
