import { Router } from 'express';
import healthRouter from './health';
import baseRouter from './base';
import urlRoutes from './urlRoutes';

const router = Router();

// Usar routers independientes
router.use('/', baseRouter);
router.use('/health', healthRouter);
router.use('/api/urls', urlRoutes);

export default router;
