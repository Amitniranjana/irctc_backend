import { error } from "node:console";
import { createClient } from "redis";

export async function redisConnect() {
    const redisConnectionString = process.env.REDIS_URL;
    if (!redisConnectionString) {
        throw new Error('redis connection key not get from .env');
    }

    try {
         const redis = createClient({
        url: redisConnectionString
    })
    redis.on('error',()=>{
        console.log('problem in making client of redis' ,error);
    })
await redis.connect();

    } catch (error) {
throw new Error('problem in connecting the redis')
    }
}