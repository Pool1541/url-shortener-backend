import { Router } from 'express';
import { createShortUrl, getAllClicks, getAllShortUrls, getOriginalUrl, registerClickEvent } from '../controllers/urlController';

const router = Router();

router.post('/shorten', createShortUrl);
router.post('/clicks/:shortUrl', registerClickEvent);
router.get('/:shortUrl', getOriginalUrl);
router.get('/', getAllShortUrls);
router.get('/clicks/:shortUrl',  getAllClicks)

export default router;
