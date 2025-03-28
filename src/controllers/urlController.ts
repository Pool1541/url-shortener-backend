import { Request, Response } from 'express';
import { sendMessage } from '../clients/kafkaClient';

export const createShortUrl = async (req: Request, res: Response): Promise<void> => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    res.status(400).json({ error: 'La URL original es requerida' });
    return;
  }

  const shortUrl = generateShortUrl(originalUrl);
  await sendMessage('url-created', [{ originalUrl, shortUrl }]);

  res.status(201).json({ originalUrl, shortUrl });
};

export const registerClickEvent = async (req: Request, res: Response): Promise<void> => {
  const { shortUrl } = req.params;

  if (!shortUrl) {
    res.status(400).json({ error: 'La URL acortada es requerida' });
    return;
  }

  await sendMessage('url-clicked', [{ shortUrl, timestamp: new Date().toISOString() }]);

  res.status(200).json({ message: 'Evento de clic registrado' });
};

const generateShortUrl = (originalUrl: string): string => {
  return Buffer.from(originalUrl).toString('base64').slice(0, 8);
};
