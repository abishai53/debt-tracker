# Traefik Deployment Setup

This guide explains how to deploy the Debt Tracking application using Docker and Traefik as a reverse proxy.

## Prerequisites

- Docker and Docker Compose installed on your system
- Basic understanding of containers and networking

## Setup Instructions

1. Clone the repository to your server

2. The project includes these key files for Traefik deployment:
   - `traefik/traefik.yml` - Traefik's static configuration
   - `traefik/dynamic/services.yml` - Dynamic configuration for routing
   - `Dockerfile.traefik` - Docker build file for the application
   - `docker-compose.traefik.yml` - Docker Compose configuration for Traefik setup

3. Deploy the application with Traefik:

```bash
docker-compose -f docker-compose.traefik.yml up -d
```

4. Access your application:
   - Web Application: http://your-server-ip
   - API Endpoints: http://your-server-ip/api
   - Traefik Dashboard: http://your-server-ip:8080 (secure this in production)

## Configuration Details

### Traefik Configuration

Traefik is configured with:
- HTTP entrypoints on ports 80 and 443
- Docker provider for automatic service discovery
- File provider for static configurations
- API dashboard for monitoring (port 8080)

### Application Configuration

The application deployment includes:
- Frontend routes handled by Traefik
- API routes with proper path prefixes
- PostgreSQL database with persistent volume
- Docker networking for service communication

## Security Considerations

For production deployments:
1. Secure the Traefik dashboard with authentication
2. Enable HTTPS with Let's Encrypt
3. Change default database credentials
4. Add proper network isolation

## Troubleshooting

If you encounter issues:
1. Check Docker container logs: `docker-compose -f docker-compose.traefik.yml logs`
2. Verify Traefik is running: `docker ps | grep traefik`
3. Inspect network connectivity between containers

## Environment Customization

You can customize the deployment by modifying:
- Database credentials in docker-compose.traefik.yml
- Domain names and routing rules in traefik/dynamic/services.yml
- Adding SSL certificates for HTTPS
