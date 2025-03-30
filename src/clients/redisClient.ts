import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export async function initializeRedis() {
  const { REDIS_URL = "redis://localhost:6379" } = process.env;

  redisClient = createClient({
    url: REDIS_URL,
  });

  redisClient.on('error', (err: any) => console.error('Redis Client Error', err));
}

export const connectRedis = async (): Promise<void> => {
  await redisClient!.connect();
  console.log('Redis Client conectado');
};

export const storeUrl = async (shortUrl: string, originalUrl: string): Promise<void> => {
  console.log({ shortUrl, originalUrl });
  try {
    await redisClient!.hSet(`short:${shortUrl}`, {
      originalUrl,
      createdAt: new Date().toISOString(),
    });
    // Crear un hash para los clics
    await redisClient!.hSet(`clicks:${shortUrl}`, { clicks: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    console.log(`URL almacenada en Redis: ${shortUrl} -> ${originalUrl}`);
  } catch (error) {
    console.error('Error al almacenar la URL en Redis:', error);
  }
};

export const incrementClicks = async (shortUrl: string, ip: string): Promise<void> => {
  try {
    await redisClient!.hIncrBy(`clicks:${shortUrl}`, 'clicks', 1);
    await redisClient!.hSet(`clicks:${shortUrl}`, 'updatedAt', new Date().toISOString());

    const clicks = parseInt(await redisClient!.hGet(`clicks:${shortUrl}`, 'clicks') as string) || 1;

    // Aquí puedo agregar más data sobre el click, como las coordenadas geográficas, el navegador, etc.
    await redisClient!.hSet(`clicks:${shortUrl}:${clicks}`, {
      ip,
      createdAt: new Date().toISOString(),
    });
    
    console.log(`Clics incrementados para ${shortUrl}: ${clicks}`);
  } catch (error) {
    console.error(`Error al incrementar los clics en ${shortUrl}:`, error);
  }
}

export const getUrl = async (shortUrl: string): Promise<any | null> => {
  try {
    const clicksInfo = await redisClient!.hGetAll(`clicks:${shortUrl}`);
    const urlInfo = await redisClient!.hGetAll(`short:${shortUrl}`);

    if (urlInfo.originalUrl === undefined) {
      return {}
    }
    
    return {
      ...urlInfo,
      clicks: clicksInfo,
    };
  } catch (error) {
    console.error('Error al obtener la URL de Redis:', error);
    return null;
  }
};

export const getAllUrls = async (): Promise<any[]> => {
  try {
    const keys = await redisClient!.keys('short:*');
    const urls = await Promise.all(
      keys.map(async (key) => {
        const data = await redisClient!.hGetAll(key);
        const clicksInfo = await redisClient!.hGetAll(`clicks:${key.replace('short:', '')}`);
        return { shortUrl: key.replace('short:', ''), ...data, clicks: clicksInfo };
      })
    );
    return urls;
  } catch (error) {
    console.error('Error al obtener todas las URLs de Redis:', error);
    return [];
  }
}

export const getAllClicksOfUrl = async (shortUrl: string): Promise<any[]> => {
  try {
    const keys = await redisClient!.keys(`clicks:${shortUrl}:*`);
    const clicks = await Promise.all(
      keys.map(async (key) => {
        const data = await redisClient!.hGetAll(key);
        return { ...data };
      })
    );
    return clicks;
  } catch (error) {
    console.error('Error al obtener todos los clics de la URL de Redis:', error);
    return [];
  }
}

export const validateIfUrlExists = async (shortUrl: string): Promise<boolean> => {
  try {
    const exists = await redisClient!.exists(`short:${shortUrl}`);
    return exists == 1;
  } catch (error) {
    console.error('Error al verificar si la URL existe en Redis:', error);
    return false;
  }
}