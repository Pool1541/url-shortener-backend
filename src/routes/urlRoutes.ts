import { Router } from 'express';
import { createShortUrl, registerClickEvent } from '../controllers/urlController';

const router = Router();

router.post('/shorten', createShortUrl);
router.post('/click/:shortUrl', registerClickEvent);

export default router;
