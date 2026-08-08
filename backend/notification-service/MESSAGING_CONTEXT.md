# Messaging Context

## Current Message Flow

The repository currently uses Kafka as the asynchronous messaging layer for notification events.

### Producer side

The producer is implemented in:

- `backend/user-service/src/kafka/producer/notification.producer.ts`
- `backend/user-service/src/config/kafka.ts`

Key behavior:

1. `NotificationProducer.initialize()` lazily connects the Kafka producer.
2. `sendMessage(topic, key, value)` serializes the payload into JSON and sends it to Kafka.
3. `sendOtpEmail(email, otp, ttlMinutes)` publishes an OTP email event.
4. `sendWelcomeEmail(email, firstName)` publishes a welcome email event.

### Topic definitions

Shared topics are defined in:

- `backend/shared/constants/kafka.topics.js`

Important notification topics:

- `notification.otp-email`
- `notification.welcome-email`
- `notification.booking-email`
- `notification.payment-email`

### Signup and OTP integration

The signup flow in:

- `backend/user-service/src/controller/Auth.ts`

sends the OTP through the email utility and stores the hashed OTP with expiry information in Prisma. The OTP notification publisher is not yet wired into the signup controller in the currently checked-in code, so the present state is:

- email delivery is handled by the `sendOtp` utility,
- Kafka publishing is available through the producer class,
- producer usage for OTP notification is prepared but not fully integrated into the live request path.

### Notification-service side

The notification service currently has a minimal Express bootstrap in:

- `backend/notification-service/src/index.ts`

That service is the intended consumer endpoint for notification events, but the Kafka consumer wiring is not yet implemented in the current codebase snapshot.

## Architectural Intent

The intended design is:

- `user-service` publishes notification events to Kafka.
- `notification-service` consumes those events and performs email or notification delivery.

This separation keeps the auth flow decoupled from delivery concerns and allows notification behavior to scale independently.
