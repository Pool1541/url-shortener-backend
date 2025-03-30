import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { connectProducer, connectConsumer, createTopic, consumeMessages, initializeKafka } from './clients/kafkaClient';
import { connectRedis, incrementClicks, initializeRedis, storeUrl } from './clients/redisClient';

const envFile = process.env.NODE_ENV === 'docker' ? '.docker.env' : '.env';
console.log(`Cargando variables de entorno desde: ${envFile}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

dotenv.config({
  path: envFile,
});

console.log( { kafka: process.env.KAFKA_BROKER_URL, redis: process.env.REDIS_URL } );

class Server {
  private app: Application;
  private port: string | number;

  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.middlewares();
    this.routes();
    this.errorHandlers();
  }

  private middlewares() {
    // Middleware de seguridad
    this.app.use(helmet());

    // Habilitar CORS
    this.app.use(cors());

    // Middleware para parsear JSON
    this.app.use(express.json());
  }

  async callbacks() {
    await consumeMessages(['url-created', 'url-clicked'], async ({ topic, value }) => {
      try {
        console.log('Mensaje recibido:', topic, value);
        switch (topic) {
          case 'url-created':
            await storeUrl(value.shortUrl, value.originalUrl);
            console.log('Mensaje recibido en el topic url-created:', value);
            break;
          case 'url-clicked':
            await incrementClicks(value.shortUrl, value.ip);
            console.log('Mensaje recibido en el topic url-clicked:', value);
            break;
          default:
            console.log(`Topic desconocido: ${topic}`);
        }

      } catch (error) {
        console.error('Error al procesar el mensaje:', error);
      }
    });
  }

  private routes() {
    this.app.use('/', routes);
  }

  private errorHandlers() {
    // Middleware para manejar rutas no encontradas
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      res.status(404).json({ error: 'Ruta no encontrada' });
    });

    // Middleware para manejar errores globales
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
  }

  public async listen() {
    try {
      initializeKafka()
      await connectProducer();
      await connectConsumer();
      await createTopic('url-created');
      await createTopic('url-clicked');
      await this.callbacks();
      await initializeRedis();
      await connectRedis();
      console.log('Kafka y Redis conectados');
    } catch (error) {
      console.error('Error al conectar servicios:', error);
    }

    this.app.listen(this.port, () => {
      console.log(`Servidor escuchando en el puerto ${this.port}`);
    });
  }
}

const server = new Server();
server.listen();
