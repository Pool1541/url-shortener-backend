import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'url-shortener-client',
  brokers: ['localhost:9092'], // Dirección del broker Kafka
});

export const createTopic = async (topic: string) => {
  const admin = kafka.admin();
  try {
    console.log('Conectando al admin...');
    await admin.connect();

    console.log('Verificando si el topic ya existe...');
    const existingTopics = await admin.listTopics();
    if (existingTopics.includes(topic)) {
      console.log(`El topic "${topic}" ya existe.`);
      return;
    }

    console.log('Creando topic...');
    await admin.createTopics({
      topics: [
        {
          topic,
          numPartitions: 1, // Define cuántas particiones tendrá
          replicationFactor: 1, // Número de réplicas (ajusta según tu cluster)
        },
      ],
    });

    console.log('Topic creado exitosamente 🎉');
  } catch (error) {
    console.error('Error al crear el topic:', error);
  } finally {
    await admin.disconnect();
  }
};

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: 'url-shortener-group' });

export const connectProducer = async (): Promise<void> => {
  await producer.connect();
  console.log('Kafka Producer conectado');
};

export const connectConsumer = async (): Promise<void> => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      await consumer.connect();
      console.log('Kafka Consumer conectado');
      return; // Salir si la conexión fue exitosa
    } catch (error: any) {
      attempts++;
      console.error(`Error conectando el Kafka Consumer: ${error.message}`);
      if (attempts >= MAX_RETRIES) {
        throw new Error(`No se pudo conectar el Kafka Consumer después de ${MAX_RETRIES} intentos`);
      }
      console.log(`Reintentando conectar el Kafka Consumer (${attempts}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS)); // Esperar antes de reintentar
    }
  }
};

const RETRY_INTERVAL_MS = 1000; // Intervalo entre reintentos en milisegundos
const MAX_RETRIES = 5; // Número máximo de reintentos

export const sendMessage = async (topic: string, messages: object[]): Promise<void> => {
  let attempts = 0;

  while (attempts < MAX_RETRIES) {
    try {
      await producer.send({
        topic,
        messages: messages.map((message) => ({ value: JSON.stringify(message) })),
      });
      console.log(`Mensajes enviados al topic ${topic}`);
      return; // Salir si el envío fue exitoso
    } catch (error: any) {
      attempts++;
      console.error(`Error enviando mensajes al topic ${topic}: ${error.message}`);
      if (attempts >= MAX_RETRIES) {
        throw new Error(`No se pudo enviar mensajes al topic ${topic} después de ${MAX_RETRIES} intentos`);
      }
      console.log(`Reintentando enviar mensajes al topic ${topic} (${attempts}/${MAX_RETRIES})...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_INTERVAL_MS)); // Esperar antes de reintentar
    }
  }
};

export const consumeMessages = async (
  topic: string,
  callback: (message: { topic: string; partition: number; value: object }) => void
): Promise<void> => {
  try {
    await consumer.subscribe({ topic, fromBeginning: true });
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        callback({
          topic,
          partition,
          value: JSON.parse(message.value!.toString()),
        });
      },
    });
  } catch (error: any) {
    console.error(`Error al consumir mensajes del topic ${topic}: ${error.message}`);
    throw new Error(`Fallo al consumir mensajes del topic ${topic}`);
  }

  consumer.on('consumer.crash', async (event) => {
    console.error('El consumidor se ha caído:', event.payload.error);
    if (event.payload.error.message.includes('rejoin is needed')) {
      console.log('Intentando reconectar al grupo...');
      await consumer.disconnect();
      await consumer.connect();
    }
  });
};
