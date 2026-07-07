# Event Booking System

A small full-stack event booking application built with NestJS, PostgreSQL, Redis/BullMQ, and React.

## What is included
- NestJS backend with booking API, queue processing, and seeded events
- PostgreSQL-backed persistence for events and bookings
- Redis queue worker for asynchronous booking confirmation
- React dashboard with filters, pagination, and a booking form

## How it works
- POST /bookings accepts a booking request immediately and returns 202-style acceptance payload.
- The booking is stored as PENDING and enqueued for asynchronous processing.
- The worker validates the event, checks remaining seats, and updates the booking status to CONFIRMED or FAILED.
- Overbooking is prevented with a pessimistic write lock during the transaction that updates the event seat counter.
- Duplicate submissions are prevented with a unique requestId constraint and an early duplicate check.

## Run locally

Prerequisites:
- Docker Desktop running
- Node.js and npm installed

### 1. Start infrastructure
Use Docker:

```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=event_booking -p 5432:5432 -d postgres:16
docker run --name redis -p 6379:6379 -d redis:7
```

If Docker Desktop is already running and the containers exist, you can start them with:

```bash
docker start postgres redis
```

If you see an error about the Docker daemon, start Docker Desktop first and wait until it shows that it is running.

### 2. Install dependencies
Open two terminals and run:

```bash
cd backend
npm install
```

```bash
cd frontend
npm install
```

### 3. Start the app
In terminal 1, start the backend:

```bash
cd backend
npm run start:dev
```

The API will be available at http://localhost:3000.

In terminal 2, start the frontend:

```bash
cd frontend
npm run dev
```

Then open http://localhost:5173.

## Design notes
- The queue ensures the booking endpoint remains fast.
- The worker uses a transaction with a pessimistic write lock so concurrent requests cannot overbook the same event.
- The unique requestId index prevents duplicate submissions from creating additional bookings.

## Next improvements
- Add Docker Compose for PostgreSQL, Redis, backend, and frontend
- Add automated tests around concurrency and duplicate handling
- Add auth and better error handling
