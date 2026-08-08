import { consumer, producer, connectProducer } from '../../config/kafka.ts';
import { KAFKA_TOPICS } from '../../../../shared/constants/kafka.topics.ts'
import { withDLQ } from '../../../../shared/utilis/dlqHandler.ts';
import sendOtp from '../../utilis/email.ts';
//import { KAFKA_TOPICS } from  '../../../../shared/constants/kafka-topics/'
//import { withDLQ } from '../../../../shared/utils/dlqHandler'

// Define interfaces for payload type safety
interface OtpEmailData {
    email: string;
    otp: string;
    ttlMinutes?: number;
}

interface WelcomeEmailData {
    email: string;
    firstName: string;
}

// Interface for the payload returned by withDLQ
interface DLQPayload {
    topic: string;
    parsedValue: any;
}

class EmailConsumer {
    public async start(): Promise<void> {
        try {
            await consumer.connect();
            await connectProducer(); // needed for DLQ publishing
          //  logger.info('Email consumer connected to Kafka');

            await consumer.subscribe({
                topics: Object.values(KAFKA_TOPICS),
                fromBeginning: false
            });

            await consumer.run({
                eachMessage: withDLQ(
                    producer,
                    KAFKA_TOPICS.DLQ_NOTIFICATION,
                    console,
                    async ({ topic, parsedValue }: DLQPayload) => {
                      //  logger.info(`Processing message from topic: ${topic}`);
                        await this.handleMessage(topic, parsedValue);
                    }
                ),
            });

          //  logger.info('Email consumer is running and listening for messages...');
        } catch (error) {
            // Safely handle unknown error types in TypeScript
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
           // logger.error('Failed to start email consumer', { error: errorMessage });
            throw error;
        }
    }

    private async handleMessage(topic: string, data: any): Promise<void> {
        switch (topic) {
            case KAFKA_TOPICS.OTP_EMAIL:
                await this.handleOtpEmail(data as OtpEmailData);
                break;

            // case KAFKA_TOPICS.WELCOME_EMAIL:
            //     await this.handleWelcomeEmail(data as WelcomeEmailData);
            //     break;

            default:
              //  logger.warn(`Unknown topic: ${topic}`);
        }
    }

    private async handleOtpEmail(data: OtpEmailData): Promise<void> {
        const { email, otp, ttlMinutes } = data;

        if (!email || !otp) {
            throw new Error('Missing required fields: email or otp');
        }

        const sent = await sendOtp(email, otp, ttlMinutes || 5);
        if (!sent) {
            throw new Error(`OTP email was not accepted for ${email}`);
        }
       // logger.info(`OTP email sent to ${email}`);
    }

    // private async handleWelcomeEmail(data: WelcomeEmailData): Promise<void> {
    //     const { email, firstName } = data;

    //     if (!email || !firstName) {
    //         throw new Error('Missing required fields: email or firstName');
    //     }

    //     await emailService.sendWelcomeEmail(email, firstName);
    //    // logger.info(`Welcome email sent to ${email}`);
    // }

    public async stop(): Promise<void> {
        await consumer.disconnect();
       // logger.info('Email consumer disconnected');
    }
}
export default new EmailConsumer();