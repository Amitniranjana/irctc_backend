import { Kafka, logLevel } from "kafkajs";

export const kafka= new Kafka({
    clientId:'user-service',
    brokers:['localhost:9092'],
    logLevel:logLevel.ERROR,
    retry:{
        initialRetryTime:300,
        retries:8,
        maxRetryTime:30000
    }
})


export const producer = kafka.producer({
    allowAutoTopicCreation: true,
    transactionTimeout: 30000,
    idempotent:true,
    retry:{
        retries:5
    },
    maxInFlightRequests:5
})

let isConnected = false;
 export const connectProducer= async()=>{
    if(!isConnected){
        await producer.connect();
        console.log('producer connect successfully ')
        isConnected=true;
    }
}


export let disconnectProducer=async()=>{
    if(isConnected){
        await producer.disconnect();
        console.log('producer disconnected')
        isConnected=false;
    }
}
// gracefull shutdown
process.on('SIGTERM',disconnectProducer);
process.on('SIGINT' ,disconnectProducer)
