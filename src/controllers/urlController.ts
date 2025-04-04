import { Request, Response } from 'express';
import { sendMessage } from '../clients/kafkaClient';
import { getAllClicksOfUrl, getAllUrls, getUrl, validateIfUrlExists, deleteUrl } from '../clients/redisClient';
import crypto from 'crypto';

export const createShortUrl = async (req: Request, res: Response): Promise<void> => {
  const { originalUrl } = req.body;

  if (!originalUrl) {
    res.status(400).json({ error: 'La URL original es requerida' });
    return;
  }

  const shortUrl = generateShortUrl(originalUrl);
  const urlExists = await validateIfUrlExists(shortUrl);

  if (urlExists) {
    res.status(409).json({ error: 'La URL acortada ya existe' });
    return;
  }

  await sendMessage('url-created', [{ originalUrl, shortUrl }]);

  res.status(201).json({ originalUrl, shortUrl });
};

export const registerClickEvent = async (req: Request, res: Response): Promise<void> => {
  const { shortUrl } = req.params;
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress?.replace('::ffff:', '') || 'unknown';

  const urlExists = await validateIfUrlExists(shortUrl);

  if (!urlExists) {
    res.status(404).json({ error: 'La URL acortada no existe' });
    return;
  }

  if (!shortUrl) {
    res.status(400).json({ error: 'La URL acortada es requerida' });
    return;
  }

  await sendMessage('url-clicked', [{ shortUrl, timestamp: new Date().toISOString(), ip: clientIP }]);

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

  res.status(200).json(originalUrl);
};

const generateShortUrl = (originalUrl: string): string => {
  const hash = crypto.createHash('sha256').update(originalUrl).digest('base64');
  return hash.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8); // Eliminar caracteres no alfanuméricos y truncar
};

export const getAllClicks = async (req: Request, res: Response): Promise<void> => {
  const { shortUrl } = req.params;

  if (!shortUrl) {
    res.status(400).json({ error: 'La URL acortada es requerida' });
    return;
  }

  const clicks = await getAllClicksOfUrl(shortUrl);

  if (!clicks) {
    res.status(404).json({ error: 'No se encontraron clics para la URL acortada proporcionada' });
    return;
  }

  res.status(200).json(clicks);
}

export const deleteUrlController = async (req: Request, res: Response): Promise<void> => {
  const { shortUrl } = req.params;

  try {
    const success = await deleteUrl(shortUrl);

    if (success) {
      res.status(200).json({ message: `URL ${shortUrl} eliminada correctamente.` });
    } else {
      res.status(404).json({ message: `URL ${shortUrl} no encontrada.` });
    }
  } catch (error) {
    console.error(`Error al eliminar la URL ${shortUrl}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};