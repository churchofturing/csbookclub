import express, { ErrorRequestHandler } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import helmet from 'helmet';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import Prisma from '@prisma/client';
import minify from 'express-minify';
import { loadFiles } from './misc/banner.js';

import routes from './routes/index.js';
import fourohfour from './misc/404.js';
import { SimpleSitemapGenerator } from './misc/sitemapGenerator.js';
import { initFloodProtection } from './misc/floodDetector.js';
import { globalLimit } from './misc/rateLimits.js';

import fivehundred from './misc/500.js';

const { PrismaClient } = Prisma;
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const server = express();

const errorHandler: ErrorRequestHandler = (_, req, res) => {
  return fivehundred(req, res);
};

const startServer = () => {
  console.log('🚀 Beginning server initialisation.');

  server.set('env', process.env.NODE_ENV);
  server.set('hostname', process.env.HOSTNAME);
  server.set('port', process.env.PORT);
  server.set('trust proxy', 1);
  server.set('view engine', 'ejs');

  server.use(cors());
  server.use(helmet());
  server.use(globalLimit);

  server.use(
    helmet.contentSecurityPolicy({
      useDefaults: true,
      directives: {
        'img-src': ["'self'", 'https: data:'],
      },
    }),
  );
  server.use(express.json({ limit: '200kb' }));
  server.use(bodyParser.urlencoded({ limit: '200kb', extended: true }));

  server.use(morgan('combined'));
  server.use(
    express.urlencoded({
      extended: true,
      limit: '200kb',
    }),
  );

  server.use(
    session({
      name: process.env.COOKIE_NAME,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // ms
        domain: process.env.NODE_ENV === 'production' ? '.csbook.club' : undefined,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      },
      secret: process.env.SECRET as string,
      resave: false,
      saveUninitialized: false,
      store: new PrismaSessionStore(new PrismaClient(), {
        checkPeriod: 2 * 60 * 1000, // ms
        dbRecordIdIsSessionId: true,
        dbRecordIdFunction: undefined,
      }),
    }),
  );

  server.set('view options', {
    rmWhitespace: true, // Removes newlines and whitespace
  });

  server.use(minify());
  // By adding a startTime to the request, we can check how quickly the page is rendered.
  server.use((req, res, next) => {
    req.startTime = Date.now();
    next();
  });
  server.use('/public', express.static(path.join(dirname, '../public')));
  server.use('/robots.txt', express.static(path.join(dirname, '../public/robots.txt')));
  server.use('/sitemap.xml', express.static(path.join(dirname, '../public/sitemap.xml')));
  server.use(routes);

  const bannersPath = path.join(dirname, '../public/banners');
  loadFiles(bannersPath).then((number) =>
    console.log(`🎨 Loaded ${number} banners from ${bannersPath}`),
  );

  try {
    const sitemapGenerateInterval = Number(process.env.SITEMAP_GENERATE_INTERVAL) || 60;
    new SimpleSitemapGenerator('https://csbook.club', sitemapGenerateInterval);
    console.log(
      `🗺️  Sitemap generated. Setting ${sitemapGenerateInterval} minute sitemap refresh.`,
    );
  } catch (e) {
    console.log('Error generating sitemap.', e);
  }

  const minTimeBetweenPosts = Number(process.env.FLOOD_TIME_MIN) || 0;
  const refreshFloodMap = Number(process.env.FLOOD_TIME_REFRESH) || 60;
  initFloodProtection(minTimeBetweenPosts, refreshFloodMap);
  console.log(
    `🛡️  Flood detector initialised - ${process.env.FLOOD_TIME_MIN} minute interval, ${process.env.FLOOD_TIME_REFRESH} minute refresh.`,
  );

  // Global 404 handler.
  server.use(errorHandler);
  server.use(fourohfour);
};

startServer();
export default server;
