
import { producer, connectProducer } from "../../config/kafka.ts";
import { KAFKA_TOPICS } from "../../../../shared/constants/kafka.topics.js"
import type { promises } from "node:timers";


export class NotificationProducer {
    private isInitialized: boolean

    constructor() {
        this.isInitialized = false;

    }
    // prevent from duplicacy
    async initialize():Promise<void> {
        if (!this.isInitialized) {
            await connectProducer();
            this.isInitialized = true;
        }
    }

    async sendMessage(topic:string, key:string, value:any) {
        try {
            await this.initialize();
            const message = {
                topic,
                messages: [
                    {
                        key: key || `${topic}-${Date.now()}`,
                        value: JSON.stringify(value),
                        timeStamp: Date.now().toString()
                    }
                ]
            }
            const result = await producer.send(message);
            console.log('successfully message send to kafka server')
            return result;
        } catch (error) {
            console.log("send message to kafka oserver or broker failed", error)
            throw error
        }
    }

    async sendOtpEmail(email:string, otp:string, ttlMinutes = 5) {
       await this.sendMessage(
            KAFKA_TOPICS.OTP_EMAIL,
            `${otp}-${email}`,
            { email, otp, ttlMinutes }

        )
    }
    async sendWelcomeEmail(email:string, firstName:string) {
        return this.sendMessage(
            KAFKA_TOPICS.WELCOME_EMAIL,
            `welcome-${email}`,
            { email, firstName }
        )
    }
}