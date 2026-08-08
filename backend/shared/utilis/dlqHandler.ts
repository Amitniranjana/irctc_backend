/**
 * Dead-Letter Queue (DLQ) handler for Kafka consumers.
 *
 * Wraps eachMessage processing with retry tracking. After DLQ_MAX_RETRIES
 * consecutive failures the message is forwarded to a per-service DLQ topic
 * and the consumer moves on instead of blocking forever.
 *
 * Usage (in any consumer):
 *   const { withDLQ } = require('../../../../shared/utils/dlqHandler');
 *   await consumer.run({ eachMessage: withDLQ(producer, dlqTopic, logger, handler) });
 */

import { DLQ_MAX_RETRIES } from '../constants/kafka.topics.ts';

interface KafkaMessage {
     key: Buffer | null;
     value: Buffer | null;
     offset: string;
     headers?: Record<string, string | Buffer | Array<string | Buffer> | undefined>;
}

interface EachMessagePayload {
     topic: string;
     partition: number;
     message: KafkaMessage;
}

interface Producer {
     send(payload: {
          topic: string;
          messages: Array<{
               key: Buffer | string | null;
               value: Buffer | string | null;
               headers: Record<string, string | Buffer | Array<string | Buffer> | undefined>;
          }>;
     }): Promise<unknown>;
}

interface Logger {
     error(message: string, metadata?: Record<string, unknown>): void;
     info(message: string, metadata?: Record<string, unknown>): void;
}

type MessageHandler = (payload: EachMessagePayload & { parsedValue: unknown }) => Promise<void> | void;

function getErrorMessage(error: unknown): string {
     return error instanceof Error ? error.message : String(error);
}

/**
 * @param {import('kafkajs').Producer} producer  – Kafka producer (for sending to DLQ)
 * @param {string}  dlqTopic   – DLQ topic name (e.g. KAFKA_TOPICS.DLQ_BOOKING)
 * @param {object}  logger     – Winston logger
 * @param {Function} handler   – async ({ topic, partition, message, parsedValue }) => void
 * @returns {Function} eachMessage-compatible handler
 */
export function withDLQ(producer: Producer, dlqTopic: string, logger: Logger, handler: MessageHandler) {
     // In-memory retry tracker: key = `${topic}:${partition}:${offset}` → attempt count
     const retryMap = new Map<string, number>();

     return async ({ topic, partition, message }: EachMessagePayload) => {
          const msgKey = `${topic}:${partition}:${message.offset}`;
          const attempt = (retryMap.get(msgKey) || 0) + 1;
          retryMap.set(msgKey, attempt);

          let parsedValue;
          try {
               parsedValue = JSON.parse(message.value?.toString() ?? '');
          } catch (parseErr) {
               // Completely unparseable — send to DLQ immediately
               logger.error(`Unparseable message on ${topic}, sending to DLQ`, {
                    partition,
                    offset: message.offset,
                    error: getErrorMessage(parseErr),
               });
               await sendToDLQ(producer, dlqTopic, topic, partition, message, parseErr, logger);
               retryMap.delete(msgKey);
               return;
          }

          try {
               await handler({ topic, partition, message, parsedValue });
               // Success — clean up
               retryMap.delete(msgKey);
          } catch (error) {
               logger.error(`Error processing ${topic} (attempt ${attempt}/${DLQ_MAX_RETRIES})`, {
                    error: getErrorMessage(error),
                    partition,
                    offset: message.offset,
               });

               if (attempt >= DLQ_MAX_RETRIES) {
                    logger.error(`Max retries exceeded for ${topic}, sending to DLQ`, {
                         partition,
                         offset: message.offset,
                    });
                    await sendToDLQ(producer, dlqTopic, topic, partition, message, error, logger);
                    retryMap.delete(msgKey);
               } else {
                    // Re-throw so KafkaJS retries (it will re-deliver the same message)
                    throw error;
               }
          }
     };
}

async function sendToDLQ(
     producer: Producer,
     dlqTopic: string,
     originalTopic: string,
     partition: number,
     message: EachMessagePayload['message'],
     error: unknown,
     logger: Logger,
): Promise<void> {
     try {
          await producer.send({
               topic: dlqTopic,
               messages: [{
                    key: message.key,
                    value: message.value,
                    headers: {
                         ...message.headers,
                         'dlq-original-topic': originalTopic,
                         'dlq-original-partition': String(partition),
                         'dlq-original-offset': message.offset,
                         'dlq-error': getErrorMessage(error),
                         'dlq-timestamp': new Date().toISOString(),
                    },
               }],
          });
          logger.info(`Message sent to DLQ: ${dlqTopic}`, { originalTopic, partition, offset: message.offset });
     } catch (dlqError) {
          // If even the DLQ publish fails, log and move on — don't block the consumer forever
          logger.error(`Failed to send message to DLQ ${dlqTopic}`, {
               error: getErrorMessage(dlqError),
               originalTopic,
               partition,
               offset: message.offset,
          });
     }
}
