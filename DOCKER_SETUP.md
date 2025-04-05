# Docker Deployment Guide for DebtTracker

This guide explains how to deploy the DebtTracker application using Docker.

## Prerequisites

- Docker installed on your system
- PostgreSQL database (can be containerized or external)

## Deployment Steps

### 1. Build the Docker Image

```bash
docker build -t debttracker .
```

This command builds a Docker image named 'debttracker' using the Dockerfile in the current directory.

### 2. Run the Docker Container

```bash
docker run -d -p 80:80 --name debttracker-app \
  -e DATABASE_URL=postgresql://username:password@host:5432/debttracker \
  debttracker
```

Replace `username`, `password`, `host`, and `debttracker` with your PostgreSQL credentials.

**Important**: When using Docker, make sure your PostgreSQL database is accessible from the container. If running PostgreSQL locally, you may need to use your host machine's IP instead of `localhost` in the DATABASE_URL.

### 3. Verify the Deployment

Open a web browser and navigate to:
```
http://localhost
```

## Using Docker Compose (Optional)

For a more complete setup including a PostgreSQL database, you can use Docker Compose:

1. Create a `docker-compose.yml` file:

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

2. Start the services:

```bash
docker-compose up -d
```

3. To stop and remove the containers:

```bash
docker-compose down
```

## Technical Details

The Docker setup uses a multi-stage build process:

1. **Build Stage**: Compiles and builds the Node.js application
2. **Production Stage**: Uses Nginx to serve the static files and proxy API requests

The Nginx configuration:
- Serves static files from the React build
- Proxies API requests to the Node.js backend

## Troubleshooting

If you encounter issues:

1. Check container logs:
   ```
   docker logs debttracker-app
   ```

2. Ensure the database is accessible from the container:
   ```
   docker exec -it debttracker-app ping your_db_host
   ```

3. Verify environment variables:
   ```
   docker exec -it debttracker-app env
   ```