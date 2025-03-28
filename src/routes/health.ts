import { Router, Request, Response } from 'express';

const healthRouter = Router();

// Ruta de salud
healthRouter.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

export default healthRouter;
