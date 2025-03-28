import { Kafka, Producer, Consumer } from 'kafkajs';

const kafka = new Kafka({
  clientId: 'url-shortener-client',
  brokers: ['localhost:9092'], // Dirección del broker Kafka
});

const producer: Producer = kafka.producer();
const consumer: Consumer = kafka.consumer({ groupId: 'url-shortener-group' });

export const connectProducer = async (): Promise<void> => {
  await producer.connect();
  console.log('Kafka Producer conectado');
};

export const connectConsumer = async (): Promise<void> => {
  await consumer.connect();
  console.log('Kafka Consumer conectado');
};

export const sendMessage = async (topic: string, messages: object[]): Promise<void> => {
  await producer.send({
    topic,
    messages: messages.map((message) => ({ value: JSON.stringify(message) })),
  });
  console.log(`Mensajes enviados al topic ${topic}`);
};

export const consumeMessages = async (
  topic: string,
  callback: (message: { topic: string; partition: number; value: object }) => void
): Promise<void> => {
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
};
