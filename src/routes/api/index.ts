import express from 'express';
import {
  deleteGeneric,
  banUser,
  unbanUser,
  pinOrUnpinPost,
  banIp,
  createAdminReferral,
  updatePost,
} from '../../controllers/index.js';

import hasRole from '../../misc/hasRole.js';

const router = express.Router();

// Secret admin shit. Avert your gaze, peasant.
router.delete('/admin/:postId', hasRole('ADMIN'), deleteGeneric);
router.delete('/admin/user/:userId', hasRole('ADMIN'), banUser);
router.delete('/admin/ban/ip', hasRole('ADMIN'), banIp);
router.post('/admin/user/:userId', hasRole('ADMIN'), unbanUser);
router.post('/admin/post/:postId', hasRole('ADMIN'), pinOrUnpinPost);
router.post('/admin/referral', hasRole('ADMIN'), createAdminReferral);
router.post('/admin/post', hasRole('ADMIN'), updatePost);

export default router;
