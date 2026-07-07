# Event Booking System

A small full-stack event booking application built with NestJS, PostgreSQL, Redis/BullMQ, and React.

## Setup and run

Prerequisites:
- Docker Desktop running
- Node.js and npm installed

### 1. Start the infrastructure
Run the following commands to start PostgreSQL and Redis:

```bash
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=event_booking -p 5432:5432 -d postgres:16
docker run --name redis -p 6379:6379 -d redis:7
```

If the containers already exist, you can start them with:

```bash
docker start postgres redis
```

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

## Key design decisions

- Booking requests are accepted immediately and stored as PENDING so the API remains responsive.
- A background queue worker processes each booking asynchronously, which keeps the booking endpoint fast.
- Overbooking is prevented by running the seat update inside a database transaction with a pessimistic write lock on the event row. This blocks competing updates and ensures the seat count is checked and updated safely.
- Duplicates are prevented by using a unique requestId for each booking attempt and by checking for an existing requestId before creating a new booking. The database also enforces a unique index on requestId for protection under concurrent requests.

## What I would improve with more time

- Add Docker Compose so the full stack can be started with a single command.
- Add automated tests for concurrency and duplicate handling.
- Add authentication, stronger validation, and better error handling.
- Improve the UI with clearer booking feedback and reservation history.
