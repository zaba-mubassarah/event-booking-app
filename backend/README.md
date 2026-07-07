# Event Booking System Backend

## Run locally

Prerequisites:
- Docker Desktop running
- Node.js and npm installed

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start PostgreSQL and Redis. The backend expects:
   - PostgreSQL on `localhost:5432`
   - Redis on `localhost:6379`

   Example Docker commands:
   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=event_booking -p 5432:5432 -d postgres:16
   docker run --name redis -p 6379:6379 -d redis:7
   ```

3. Create your environment file from the example:
   ```bash
   copy .env.example .env
   ```

4. Start the backend:
   ```bash
   npm run start:dev
   ```

The API will be available at http://localhost:3000, and the app will seed sample events on startup.

