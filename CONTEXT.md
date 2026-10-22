# IRCTC Backend Context

## 1. Project purpose
This repository is a Node.js backend for an IRCTC-style service with a user authentication flow, OTP-based signup verification, PostgreSQL persistence, Redis caching, and Kafka-ready notification integration.

The repository currently contains:
- `backend/user-service` — main Express API
- `backend/notification-service` — notification-oriented service scaffold
- `backend/shared` — shared constants and cross-service definitions
- `frontend/` — frontend shell
- root infra files for Docker Compose and Prisma

## 2. Current architecture

### User service
The main application is in `backend/user-service`.
It exposes an Express server through `src/index.ts` and routes auth endpoints through `src/routes/userRoutes.ts`.

Relevant flow:
- `GET /` -> health check route
- `POST /api/auth/signup` -> create OTP request
- `POST /api/auth/login` -> login attempt
- `POST /api/auth/verify-otp` -> validate OTP, issue JWT cookies

### Controllers
- `src/controller/Auth.ts` handles signup/login/OTP verification logic
- `src/controller/user.ts` handles profile retrieval and cache lookup

### Middleware and utilities
- `src/middleware/auth.middleware.ts` is intended for protected routes
- `src/utilis/generateOtp.ts` generates OTP values
- `src/utilis/generateTokens.ts` creates access and refresh tokens
- `src/utilis/tokenParser.ts` parses cookies and extracts tokens

## 3. Data layer

### Prisma
The project uses Prisma with PostgreSQL.
Models are defined in `backend/user-service/prisma/schema.prisma`:

- `User`
  - `id`
  - `firstname`
  - `lastname`
  - `email`
  - `password`
  - `isVerified`
  - `emailVerified`
  - `createdAt`
  - `updatedAt`

- `otp`
  - `id`
  - `email`
  - `otp`
  - `expiryTime`
  - `createdAt`

A database connection string is configured via `.env` using `DATABASE_URL`.

### Redis
Redis is configured in `backend/user-service/src/config/redis.ts`.
Current behavior:
- reads `REDIS_URL` from environment
- creates a Redis client with `createClient()`
- registers `ready` and `error` event listeners
- exposes `redisConnect()` to connect only when not already open

The profile retrieval logic in `src/controller/user.ts` uses Redis cache before querying the database:
- checks `user:{id}` in Redis
- if cached, returns saved user object
- otherwise fetches user via `prisma.user.findUnique({ where: { id } })`
- stores the response in Redis with TTL = 3600 seconds

## 4. Authentication flow
Current auth flow is:
1. User signs up with firstname, lastname, email, password, confirmPassword
2. Code checks whether email already exists
3. Generates OTP
4. Sends OTP via notification infrastructure
5. Stores hashed OTP + expiry in Prisma
6. User verifies OTP with email + OTP
7. If valid, user is looked up, JWT tokens are created, and cookies are set

Security setup:
- `bcrypt` is used for password hashing and OTP comparison
- JWT tokens are generated using environment-based secret keys
- Access and refresh tokens are stored in HTTP-only cookies

## 5. Infrastructure
Docker Compose includes:
- PostgreSQL on port `5433` host -> `5432` container
- Redis on port `6379`
- Kafka on port `9092`

This infrastructure is defined in `docker-compose.yml` at the repo root.

## 6. Current implementation status
The project is in a partially integrated state:
- OTP signup flow is implemented
- Redis cache setup is present and profile route uses it
- Prisma database models and queries are in place
- Kafka producer wiring exists for notification events
- Notification service is scaffolded but not yet fully integrated into the main user flow

## 7. Important technical notes
- The project uses TypeScript with ESM-style imports (`type: module` in package config)
- Some files still mix direct Prisma instantiation and newer shared config patterns
- The Redis logic and profile controller are now aligned around a cache-first read model
- The codebase still needs cleanup and standardization for a single shared Prisma client pattern across controllers

## 8. Known focus areas for next work
- unify Prisma initialization into a shared singleton client
- validate production startup sequence for PostgreSQL, Redis, and Kafka
- complete notification service integration with Kafka consumer/producer flow
- standardize route-level error handling and token validation logic
- add proper database migration and seeding documentation
