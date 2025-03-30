import { createClient } from 'redis';

const redisClient = createClient({
  url: 'redis://localhost:6379', // Dirección del servicio Redis
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export const connectRedis = async (): Promise<void> => {
  await redisClient.connect();
  console.log('Redis Client conectado');
};

export const storeUrl = async (shortUrl: string, originalUrl: string): Promise<void> => {
  console.log({ shortUrl, originalUrl });
  try {
    await redisClient.hSet(`short:${shortUrl}`, {
      originalUrl,
      createdAt: new Date().toISOString(),
      clicks: 0,
    });
    console.log(`URL almacenada en Redis: ${shortUrl} -> ${originalUrl}`);
  } catch (error) {
    console.error('Error al almacenar la URL en Redis:', error);
  }
};

export const incrementClicks = async (shortUrl: string): Promise<void> => {
  try {
    await redisClient.hIncrBy(`short:${shortUrl}`, 'clicks', 1);
    const clicks = await redisClient.hGet(`short:${shortUrl}`, 'clicks');
    console.log(`Clics incrementados para ${shortUrl}: ${clicks}`);
  } catch (error) {
    console.error(`Error al incrementar los clics en ${shortUrl}:`, error);
  }
}

export const getUrl = async (shortUrl: string): Promise<any | null> => {
  try {
    return await redisClient.hGetAll(`short:${shortUrl}`);
  } catch (error) {
    console.error('Error al obtener la URL de Redis:', error);
    return null;
  }
};

export const getAllUrls = async (): Promise<any[]> => {
  try {
    const keys = await redisClient.keys('short:*');
    const urls = await Promise.all(
      keys.map(async (key) => {
        const data = await redisClient.hGetAll(key);
        return { shortUrl: key.replace('short:', ''), ...data };
      })
    );
    return urls;
  } catch (error) {
    console.error('Error al obtener todas las URLs de Redis:', error);
    return [];
  }
}
