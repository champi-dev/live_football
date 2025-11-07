#!/bin/bash

# LiveFootball - Services Setup Script
# This script sets up PostgreSQL and Redis for the application

set -e

echo "🔧 Setting up LiveFootball services..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Database credentials
DB_NAME="livefootball"
DB_USER="postgres"
DB_PASSWORD="postgres"

echo -e "${YELLOW}📊 Setting up PostgreSQL...${NC}"

# Create PostgreSQL user if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = 'postgres'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Set password for postgres user
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD '$DB_PASSWORD';"

# Create database if it doesn't exist
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${GREEN}✅ PostgreSQL configured!${NC}"
echo -e "   Database: $DB_NAME"
echo -e "   User: $DB_USER"
echo -e "   Password: $DB_PASSWORD"

echo ""
echo -e "${YELLOW}🔴 Setting up Redis...${NC}"

# Check if Redis is installed
if ! command -v redis-server &> /dev/null; then
    echo -e "${YELLOW}Installing Redis...${NC}"
    sudo apt-get update
    sudo apt-get install -y redis-server
fi

# Configure Redis to bind to localhost
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf 2>/dev/null || true

# Start and enable Redis
sudo systemctl restart redis-server
sudo systemctl enable redis-server

# Test Redis connection
if redis-cli ping &> /dev/null; then
    echo -e "${GREEN}✅ Redis is running!${NC}"
else
    echo -e "${RED}❌ Redis failed to start${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🗄️  Running database migrations...${NC}"

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Run Prisma migrations
npm run prisma:migrate

echo ""
echo -e "${GREEN}🎉 All services are set up!${NC}"
echo ""
echo -e "${YELLOW}Summary:${NC}"
echo -e "  ✅ PostgreSQL running on port 5432"
echo -e "  ✅ Redis running on port 6379"
echo -e "  ✅ Database '$DB_NAME' created and migrated"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. Make sure your backend/.env has the correct settings (already configured)"
echo -e "  2. Restart your backend server if it's running"
echo ""
echo -e "${GREEN}You're ready to go!${NC}"
