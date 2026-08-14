import { createClient } from "redis";

const redisConnectionString = process.env.REDIS_URL;

if (!redisConnectionString) {
    throw new Error('REDIS_URL connection key is missing in .env file');
}

export const redisClient = createClient({
    url: redisConnectionString
});

// Event Listeners (Module level par - Only registered once)
redisClient.on('ready', () => {
    console.log('Redis connected successfully!');
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

export async function redisConnect() {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
    } catch (error) {
        console.error('Failed to connect to Redis:', error);
        throw error; // Original error retain rahega
    }
}