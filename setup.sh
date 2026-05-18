#!/bin/bash

# HDI System Setup Script for Linux/WSL

echo "Starting HDI System Setup..."

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker could not be found. Please install Docker first."
    exit
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null
then
    echo "Docker Compose could not be found. Please install Docker Compose first."
    exit
fi

echo "Building and starting containers..."
docker-compose up --build -d

echo "Waiting for database to be ready..."
sleep 10

echo "Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

echo "Seeding database..."
docker-compose exec backend node scripts/seed/final_seed.js

echo "Setup complete!"
echo "Backend is running at http://localhost:5000"
echo "Frontend is running at http://localhost"
