# IRCTC Backend Node.js

This repository contains a Node.js backend for authentication, OTP verification, Redis-backed profile caching, and Kafka-ready notification integration, with a lightweight frontend shell.

## Project overview

The project is split into the following main parts:

- `backend/user-service` — main Express API with Prisma, PostgreSQL, Redis, JWT auth, and OTP signup flow
- `backend/notification-service` — notification service scaffold for future email/event consumers
- `backend/shared` — shared constants and service-level definitions
- `frontend/` — Next.js frontend shell

## Current capabilities

The current implementation supports:

- User signup flow with validation
- OTP generation and hash storage
- OTP verification and JWT cookie issuance
- Password hashing with bcrypt
- Prisma-backed persistence for `User` and `otp`
- Redis-based profile caching with TTL
- Kafka producer setup for notification events
- Protected route middleware pattern

## Tech stack

### Backend

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Redis
- Kafka with `kafkajs`
- Resend for email delivery
- Docker Compose for service infrastructure

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Repository structure

```text
.
├── backend/
│   ├── notification-service/
│   ├── shared/
│   └── user-service/
├── frontend/
├── docker-compose.yml
├── prisma/
├── README.md
├── package.json
└── tsconfig.json
```

## Authentication and workflow

### 1. Signup

`POST /api/auth/signup`

Request body:

```json
{
  "firstname": "Amit",
  "lastname": "Niranjana",
  "email": "user@example.com",
  "password": "StrongPass123",
  "confirmpassword": "StrongPass123"
}
```

What happens:

- validates all required fields
- checks password confirmation
- checks if email already exists
- creates a one-time OTP
- stores hashed OTP with expiry in Prisma
- sends the OTP via the notification layer

### 2. Verify OTP

`POST /api/auth/verify-otp`

Request body:

```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

What happens:

- fetches the OTP record for the email
- validates expiry time
- compares submitted OTP with hashed OTP
- loads the user account
- creates access + refresh JWTs
- stores tokens as HTTP-only cookies
- deletes the OTP record after success

### 3. Profile retrieval with Redis cache

The profile route is implemented in `backend/user-service/src/controller/user.ts`.

Behavior:

- reads the cookie token
- verifies JWT payload and extracts user id
- checks Redis for `user:{id}` cache
- if cached: returns cached result immediately
- otherwise: fetches the user from Prisma using `id`
- stores the pruned user object in Redis with a 1-hour TTL

This reduces repeated DB lookups for profile reads.

### 4. Messaging layer

The codebase contains a Kafka-based notification pipeline:

- `backend/user-service/src/config/kafka.ts` configures producer support
- `backend/user-service/src/kafka/producer/notification.producer.ts` publishes events
- `backend/shared/constants/kafka.topics.js` contains topic names
- `backend/notification-service` is the intended consumer service

Current topic examples include:

- `notification.otp-email`
- `notification.welcome-email`
- `notification.booking-email`
- `notification.payment-email`

## Backend setup

### 1. Install dependencies

```bash
cd backend/user-service
npm install
```

### 2. Configure environment variables

Create a `.env` file in `backend/user-service`:

```bash
DATABASE_URL="postgresql://postgres:password1235@localhost:5433/irctc_backend"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your_jwt_secret"
GENERATE_ACCESS_KEY="your_access_key"
GENERATE_REFRESH_KEY="your_refresh_key"
RESEND_API_KEY="your_resend_api_key"
KAFKA_BROKER="localhost:9092"
NODE_ENV="development"
```

### 3. Start infrastructure with Docker Compose

From the repo root:

```bash
docker compose up -d
```

This starts:

- PostgreSQL on `localhost:5433`
- Redis on `localhost:6379`
- Kafka on `localhost:9092`

### 4. Run Prisma migrations

```bash
cd backend/user-service
npx prisma generate
npx prisma migrate deploy
```

### 5. Start the API

```bash
cd backend/user-service
npm run dev
```

The user service API runs at:

- `http://localhost:3000`

### 6. Start the notification service

```bash
cd backend/notification-service
npm run dev
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend is served at:

- `http://localhost:3000`

## Available scripts

### User service

- `npm run dev` — starts the Express server in development mode
- `npm run build` — compiles TypeScript
- `npm run start` — starts the compiled production build

### Notification service

- `npm run dev` — starts the notification service

### Frontend

- `npm run dev` — starts the Next.js app
- `npm run build` — creates the production build
- `npm run start` — runs the production build
- `npm run lint` — runs ESLint

## Environment notes

- PostgreSQL is used for persistent user and OTP data
- Redis is used for profile caching and quick read access
- Resend is used for email sending
- Kafka is scaffolded for notification event flows
- JWTs are issued as cookies for protected requests

## Current status

The repository currently implements the main signup, OTP verification, JWT issuance, and Redis-backed profile retrieval flow in the user service. The notification service and Kafka pipeline are present as integration points for future async messaging and outbound notification delivery.
