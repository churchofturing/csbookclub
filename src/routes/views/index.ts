import express from 'express';
import { Request, Response, NextFunction } from 'express';

import {
  getIndexPage,
  logout,
  login,
  register,
  getLoginPage,
  getUserPage,
  createReferral,
  progRedirect,
  getAllTopicsRss,
  getAdminPage,
  getTopic,
  getSingleTopicRss,
  createTopic,
  createThread,
  getSingleThreadRss,
  getThread,
  getThreadRedirect,
  createReply,
} from '../../controllers/index.js';

import { csrfSynchronisedProtection } from '../../misc/csrfFilter.js';
import { precheckMiddleware } from '../../misc/floodDetector.js';
import hasRole from '../../misc/hasRole.js';
import bannedAccountFilter from '../../misc/bannedAccountFilter.js';
import ipBanFilter from '../../misc/ipBanFilter.js';
import { authLimit, registerLimit } from '../../misc/rateLimits.js';

const router = express.Router();

/*
  This is a hack.
  There is a library I'm using to mitigate Cross-Site Request Forgery.
  When it comes to testing, it's a huge ballache trying to mock the CSRFTokens...
  So I just disable it when testing. Genius.
*/
const csrfProtect =
  process.env.NODE_ENV === 'test'
    ? (req: Request, res: Response, next: NextFunction) => next()
    : csrfSynchronisedProtection;

const authLimitCheck =
  process.env.NODE_ENV === 'test'
    ? (req: Request, res: Response, next: NextFunction) => next()
    : authLimit;

const registerLimitCheck =
  process.env.NODE_ENV === 'test'
    ? (req: Request, res: Response, next: NextFunction) => next()
    : registerLimit;

// Miscellaneous pages.
router.get('/', getIndexPage);
router.get('/.rss', getAllTopicsRss);
router.get('/admin', hasRole('ADMIN'), getAdminPage);

// Everything user related.
router.post('/user/login', authLimitCheck, ipBanFilter(getLoginPage), csrfProtect, login);
router.get('/user/login', getLoginPage);
router.post('/user/logout', logout);
router.post('/user/referral', createReferral);
router.post('/user/register', registerLimitCheck, csrfProtect, ipBanFilter(getLoginPage), register);
router.get('/user/:username', getUserPage);

// :slug is how we identify topics. E.g general, prog, lectures.
router.get('/:slug', getTopic);
router.get('/:slug/.rss', getSingleTopicRss);
// Only admins can create a topic.
router.post('/topic', hasRole('ADMIN'), createTopic);
router.post(
  '/:slug',
  csrfProtect,
  ipBanFilter(getTopic),
  precheckMiddleware(getTopic),
  bannedAccountFilter(getTopic),
  createThread,
);

router.get('/:slug/:globalCount/:threadSlug', getThread);
router.get('/:slug/:globalCount/:threadSlug/.rss', getSingleThreadRss);
router.get('/:slug/:globalCount', getThreadRedirect);

router.post(
  '/:slug/:globalCount',
  csrfProtect,
  ipBanFilter(getThread),
  precheckMiddleware(getThread),
  bannedAccountFilter(getThread),
  createReply,
);

// I imported a /prog/ database. Inside the posts were relative urls.
// Like >>2 would be <a href="/read/prog/111111/2"
// These redirects actually make it work. Crude but clever.
router.get('/prog/read/prog/:globalCount/:postId', progRedirect);
router.get('/read/prog/:globalCount/:postId', progRedirect);
router.get('/prog/:globalCount/read/prog/:globalCount/:postId', progRedirect);

export default router;
