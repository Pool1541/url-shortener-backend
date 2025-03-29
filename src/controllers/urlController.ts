import { Request, Response } from 'express';
import { sendMessage } from '../clients/kafkaClient';
import { getAllUrls, getUrl } from '../clients/redisClient';
import crypto from 'crypto';

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

export const getAllShortUrls = async (req: Request, res: Response ): Promise<void> => {
  const urls = await getAllUrls();

  if (!urls || urls.length === 0) {
    res.status(404).json({ error: 'No se encontraron URLs acortadas' });
    return;
  };

  res.status(200).json({ urls });
}

export const getOriginalUrl = async (req: Request, res: Response): Promise<void> => {
  const { shortUrl } = req.params;

  if (!shortUrl) {
    res.status(400).json({ error: 'La URL acortada es requerida' });
    return;
  }

  const originalUrl = await getUrl(shortUrl);

  if (!originalUrl) {
    res.status(404).json({ error: 'No se encontró la URL original para la URL acortada proporcionada' });
    return;
  }

  res.status(200).json({ originalUrl });
};

const generateShortUrl = (originalUrl: string): string => {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8); // Eliminar caracteres no alfanuméricos y truncar
};