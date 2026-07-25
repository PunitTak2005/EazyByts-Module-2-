import express from 'express';
import { getHeadlines } from '../controllers/newsController.js';

const router = express.Router();

// GET /api/news/headlines - Live headlines from Yahoo Finance
router.get('/headlines', getHeadlines);
router.get('/', getHeadlines);

export default router;
