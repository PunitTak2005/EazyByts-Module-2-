import express from 'express';
import { getTickerData } from '../controllers/stockTickerController.js';
const router = express.Router();

router.get('/', getTickerData);

export default router;
