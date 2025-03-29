import { Router } from 'express';
import { createShortUrl, getAllShortUrls, getOriginalUrl, registerClickEvent } from '../controllers/urlController';

const router = Router();

router.post('/shorten', createShortUrl);
router.post('/click/:shortUrl', registerClickEvent);
router.get('/:shortUrl', getOriginalUrl);
router.get('/', getAllShortUrls);

export default router;
