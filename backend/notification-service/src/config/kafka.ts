import { Kafka, logLevel } from 'kafkajs';

const kafka = new Kafka({
    clientId: 'notification-service',
    brokers: [process.env.KAFKA_BROKER ?? 'localhost:9092'],
    logLevel: logLevel.ERROR,
});

export const consumer = kafka.consumer({ groupId: 'notification-service' });
export const producer = kafka.producer();

let isConsumerConnected = false;

export const connectConsumer = async (): Promise<void> => {
    if (!isConsumerConnected) {
        await consumer.connect();
        isConsumerConnected = true;
        console.log('Kafka consumer connected');
    }
};

export const connectProducer = async (): Promise<void> => {
    await producer.connect();
};

export const disconnectConsumer = async (): Promise<void> => {
    if (isConsumerConnected) {
        await consumer.disconnect();
        isConsumerConnected = false;
        console.log('Kafka consumer disconnected');
    }
};
