import express from 'express';
import views from './views/index.js';
import api from './api/index.js';

const router = express.Router();
router.use('/', views);
router.use('/api', api);

export default router;
