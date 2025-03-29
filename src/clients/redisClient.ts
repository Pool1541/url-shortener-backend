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
  try {
    await redisClient.set(shortUrl, originalUrl);
    console.log(`URL almacenada en Redis: ${shortUrl} -> ${originalUrl}`);
  } catch (error) {
    console.error('Error al almacenar la URL en Redis:', error);
  }
};

export const getUrl = async (shortUrl: string): Promise<string | null> => {
  try {
    return await redisClient.get(shortUrl);
  } catch (error) {
    console.error('Error al obtener la URL de Redis:', error);
    return null;
  }
};

export const getAllUrls = async (): Promise<string[]> => {
  try {
    const keys = await redisClient.keys('*');
    // const urls = await Promise.all(keys.map((key) => redisClient.get(key)));
    // return urls.filter((url) => url !== null) as string[];
    return keys;
  } catch (error) {
    console.error('Error al obtener todas las URLs de Redis:', error);
    return [];
  }
}
