import { Router } from 'express';
import { getBase } from '../controllers/baseController';

const baseRouter = Router();

// Ruta base
baseRouter.get('/', getBase);

export default baseRouter;
