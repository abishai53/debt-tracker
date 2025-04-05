# DebtTracker - Finance Management Application

A web application for tracking debtors, creditors, and transaction balances.

## Features

- Dashboard Overview: See your financial summary at a glance
- People Management: Track all your financial relationships 
- Transaction Tracking: Record all financial transactions
- Reports: Get insights on your finances
- PostgreSQL Database: Secure data storage

## Self-Hosting Instructions

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_URL=postgresql://username:password@localhost:5432/debttracker
```

### Standard Deployment

1. Clone the repository
   ```
   git clone <repository-url>
   cd debttracker
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Run database migrations
   ```
   npm run db:push
   ```

4. Build the application
   ```
   npm run build
   ```

5. Start the server
   ```
   npm start
   ```

### Docker Deployment

The application includes Docker support for containerized deployment.

1. Build the Docker image
   ```
   docker build -t debttracker .
   ```

2. Run the container
   ```
   docker run -d -p 80:80 --name debttracker-app \
     -e DATABASE_URL=postgresql://username:password@host:5432/debttracker \
     debttracker
   ```

Note: When using Docker, make sure your PostgreSQL database is accessible from the container. If you're running PostgreSQL locally, you may need to use your host machine's IP instead of `localhost` in the DATABASE_URL.

### Docker Compose (Optional)

Create a `docker-compose.yml` file:

```yaml
version: '3'

services:
  app:
    build: .
    ports:
      - "80:80"
    environment:
      - DATABASE_URL=postgresql://username:password@db:5432/debttracker
    depends_on:
      - db

  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=username
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=debttracker
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Run with:
```
docker-compose up -d
```
