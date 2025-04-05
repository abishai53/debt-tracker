FROM node:20-slim

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Copy project files
COPY . .

