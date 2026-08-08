import express  from 'express';
import type{ Request, Response } from 'express';
import notificationConsumer from './kafka/consumer/notification.consumer.ts';
const app=  express();


app.get('/',(req:Request,res:Response)=>{
res.send('hello world')
})
app.listen(3001,()=>{
    console.log("notification server is running on 3001 port")
})

notificationConsumer.start().catch((error: unknown) => {
    console.error('Notification consumer failed to start:', error);
    process.exitCode = 1;
});