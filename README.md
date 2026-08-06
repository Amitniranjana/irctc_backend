# IRCTC Backend Node.js

This repository contains a Node.js backend services setup for authentication, OTP workflows, and future notification/event-driven integrations, along with a lightweight Next.js frontend shell.

## Project Overview

The project is split into the following main parts:

- `backend/user-service` — Express.js API with Prisma ORM, PostgreSQL, Kafka producer wiring, and OTP signup flow
- `backend/notification-service` — notification-focused service scaffold with Express and future Kafka consumer responsibilities
- `backend/shared` — shared constants and cross-service topic definitions
- `frontend/` — Next.js frontend shell

## Current Backend Capabilities

The current implementation supports:

- User signup
- OTP generation and email delivery
- OTP verification and user creation
- Password hashing with bcrypt
- Prisma-backed OTP persistence
- Kafka producer support for notification topics
- JWT-ready route protection middleware

## Tech Stack

### Backend

- Node.js
- TypeScript
- Express.js
- Prisma ORM
- PostgreSQL
- Kafka with `kafkajs`
- Resend for OTP email delivery
- Docker Compose for PostgreSQL and Kafka infrastructure

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

## Repository Structure

```text
.
├── backend/
│   ├── notification-service/
│   ├── shared/
│   └── user-service/
└── frontend/
```

## Authentication and Notification Flow

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

- Validates required fields
- Confirms password match
- Checks whether the email already exists
- Generates an OTP and sends it through the email utility
- Stores the hashed OTP and its expiry in Prisma

### 2. Verify OTP

`POST /api/auth/verify-otp`

Request body:

```json
{
  "firstname": "Amit",
  "lastname": "Niranjana",
  "email": "user@example.com",
  "password": "StrongPass123",
  "confirmpassword": "StrongPass123",
  "otp": "123456"
}
```

What happens:

- Retrieves the stored OTP record for the email
- Validates whether the OTP has expired
- Compares the submitted OTP with the stored hash
- Creates the user record in PostgreSQL
- Deletes the OTP record after successful verification

### 3. Messaging Layer

The codebase contains a Kafka-based notification pipeline:

- `backend/user-service/src/config/kafka.ts` sets up the Kafka producer
- `backend/user-service/src/kafka/producer/notification.producer.ts` publishes messages
- `backend/shared/constants/kafka.topics.js` centralizes the topic names
- `backend/notification-service` is the intended notification consumer service

Current message topics include:

- `notification.otp-email`
- `notification.welcome-email`
- `notification.booking-email`
- `notification.payment-email`

## Backend Setup

### 1. Install dependencies

```bash
cd backend/user-service
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend/user-service/` directory using the example below:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/irctc?schema=public"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=irctc
POSTGRES_PORT=5432
PGADMIN_DEFAULT_EMAIL=admin@example.com
PGADMIN_DEFAULT_PASSWORD=admin123
PGADMIN_PORT=5050
JWT_SECRET=your_jwt_secret
RESEND_API_KEY=your_resend_api_key
KAFKA_BROKER=localhost:9092
```

### 3. Start infrastructure with Docker Compose

```bash
cd backend/user-service
docker compose up -d
```

### 4. Run Prisma migrations

```bash
npx prisma migrate deploy
```

### 5. Start the API

```bash
npm run dev
```

The user service API runs on:

- `http://localhost:3000`

### 6. Start the notification service

```bash
cd backend/notification-service
npm run dev
```

The notification service currently starts on:

- `http://localhost:3001`

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend is served at:

- `http://localhost:3000`

## Available Scripts

### User Service

- `npm run dev` — starts the Express server in development mode
- `npm run build` — compiles TypeScript
- `npm run start` — runs the compiled production build

### Notification Service

- `npm run dev` — starts the notification service with `tsx watch`

### Frontend

- `npm run dev` — starts the Next.js development server
- `npm run build` — creates a production build
- `npm run start` — starts the production server
- `npm run lint` — runs ESLint

## Environment Notes

- The user service uses Prisma with PostgreSQL.
- OTP emails are sent using Resend.
- Kafka messaging is scaffolded for future asynchronous notification delivery.
- Protected routes can be guarded using the `Auth` middleware from `src/middleware/auth.middleware.ts`.

## Current Status

The repository currently implements the core signup and OTP verification workflow in the user service and includes a Kafka-based notification publishing layer for event-driven delivery. The notification service is present as a separate service scaffold and is intended to consume these events as the project evolves.
