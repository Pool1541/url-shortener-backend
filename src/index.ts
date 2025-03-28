import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import routes from './routes';
import { connectProducer, connectConsumer } from './clients/kafkaClient';

dotenv.config();

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
      await connectProducer();
      await connectConsumer();
      console.log('Kafka Producer y Consumer conectados');
    } catch (error) {
      console.error('Error al conectar Kafka:', error);
    }

    this.app.listen(this.port, () => {
      console.log(`Servidor escuchando en el puerto ${this.port}`);
    });
  }
}

const server = new Server();
server.listen();
