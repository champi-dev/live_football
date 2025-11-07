#!/bin/bash

# LiveFootball Production Startup Script
# This script builds and starts the application in production mode with ngrok

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored message
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print header
clear
echo "=========================================="
print_message "$BLUE" "🚀 LiveFootball Production Startup"
echo "=========================================="
echo ""

# Check prerequisites
print_message "$YELLOW" "📋 Checking prerequisites..."

if ! command_exists node; then
    print_message "$RED" "❌ Node.js is not installed"
    exit 1
fi
print_message "$GREEN" "✅ Node.js: $(node --version)"

if ! command_exists npm; then
    print_message "$RED" "❌ npm is not installed"
    exit 1
fi
print_message "$GREEN" "✅ npm: $(npm --version)"

if ! command_exists ngrok; then
    print_message "$RED" "❌ ngrok is not installed"
    print_message "$YELLOW" "   Install from: https://ngrok.com/download"
    exit 1
fi
print_message "$GREEN" "✅ ngrok: $(ngrok version)"

if ! command_exists psql; then
    print_message "$RED" "❌ PostgreSQL client is not installed"
    exit 1
fi
print_message "$GREEN" "✅ PostgreSQL client installed"

if ! command_exists redis-cli; then
    print_message "$RED" "❌ Redis client is not installed"
    exit 1
fi
print_message "$GREEN" "✅ Redis client installed"

echo ""

# Check if services are running
print_message "$YELLOW" "🔍 Checking required services..."

if ! pg_isready -q; then
    print_message "$RED" "❌ PostgreSQL is not running"
    print_message "$YELLOW" "   Start with: sudo systemctl start postgresql"
    exit 1
fi
print_message "$GREEN" "✅ PostgreSQL is running"

if ! redis-cli ping > /dev/null 2>&1; then
    print_message "$RED" "❌ Redis is not running"
    print_message "$YELLOW" "   Start with: redis-server"
    exit 1
fi
print_message "$GREEN" "✅ Redis is running"

echo ""

# Check environment variables
print_message "$YELLOW" "🔐 Checking environment configuration..."

if [ ! -f "backend/.env" ]; then
    print_message "$RED" "❌ backend/.env file not found"
    exit 1
fi
print_message "$GREEN" "✅ Backend .env file exists"

if [ ! -f "frontend/.env.production" ]; then
    print_message "$RED" "❌ frontend/.env.production file not found"
    exit 1
fi
print_message "$GREEN" "✅ Frontend .env.production file exists"

if [ ! -f "ngrok.yml" ]; then
    print_message "$RED" "❌ ngrok.yml configuration not found"
    exit 1
fi
print_message "$GREEN" "✅ ngrok configuration file exists"

echo ""

# Build frontend
print_message "$YELLOW" "🏗️  Building frontend..."
cd frontend
npm run build
if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Frontend build successful"
else
    print_message "$RED" "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""

# Build backend
print_message "$YELLOW" "🏗️  Building backend..."
cd backend
npm run build
if [ $? -eq 0 ]; then
    print_message "$GREEN" "✅ Backend build successful"
else
    print_message "$RED" "❌ Backend build failed"
    exit 1
fi
cd ..

echo ""

# Check if port is available
print_message "$YELLOW" "🔍 Checking if port 3456 is available..."
if lsof -Pi :3456 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_message "$RED" "❌ Port 3456 is already in use"
    print_message "$YELLOW" "   Stop the existing process or change PORT in .env"
    exit 1
fi
print_message "$GREEN" "✅ Port 3456 is available"

echo ""

# Start backend
print_message "$YELLOW" "🚀 Starting backend server..."
cd backend
NODE_ENV=production nohup npm start > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../backend.pid
cd ..

# Wait for backend to start
sleep 3

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_message "$RED" "❌ Backend failed to start"
    print_message "$YELLOW" "   Check logs/backend.log for errors"
    exit 1
fi

print_message "$GREEN" "✅ Backend started (PID: $BACKEND_PID)"

# Check backend health
sleep 2
if curl -s http://localhost:3456/health > /dev/null; then
    print_message "$GREEN" "✅ Backend health check passed"
else
    print_message "$RED" "❌ Backend health check failed"
    kill $BACKEND_PID
    exit 1
fi

echo ""

# Start ngrok
print_message "$YELLOW" "🌐 Starting ngrok tunnel..."
nohup ngrok start --config ngrok.yml livefootball > logs/ngrok.log 2>&1 &
NGROK_PID=$!
echo $NGROK_PID > ngrok.pid

# Wait for ngrok to start
sleep 3

# Check if ngrok is running
if ! kill -0 $NGROK_PID 2>/dev/null; then
    print_message "$RED" "❌ ngrok failed to start"
    print_message "$YELLOW" "   Check logs/ngrok.log for errors"
    print_message "$YELLOW" "   Make sure you've added your authtoken to ngrok.yml"
    kill $BACKEND_PID
    exit 1
fi

print_message "$GREEN" "✅ ngrok tunnel started (PID: $NGROK_PID)"

echo ""
echo "=========================================="
print_message "$GREEN" "✅ LiveFootball is now running!"
echo "=========================================="
echo ""

print_message "$BLUE" "📍 URLs:"
echo "   Local:        http://localhost:3456"
echo "   Public:       https://livefootball.lat"
echo "   ngrok Web UI: http://localhost:4040"
echo ""

print_message "$BLUE" "📊 Quick Health Checks:"
echo "   Backend Health:  curl http://localhost:3456/health"
echo "   Sync Status:     curl http://localhost:3456/api/sync/status"
echo "   ngrok Tunnels:   curl http://localhost:4040/api/tunnels"
echo ""

print_message "$BLUE" "📁 Log Files:"
echo "   Backend: logs/backend.log"
echo "   ngrok:   logs/ngrok.log"
echo ""

print_message "$BLUE" "🛑 To Stop Services:"
echo "   ./stop-production.sh"
echo "   Or manually: kill $BACKEND_PID $NGROK_PID"
echo ""

print_message "$YELLOW" "📝 Process IDs saved to:"
echo "   backend.pid: $BACKEND_PID"
echo "   ngrok.pid:   $NGROK_PID"
echo ""

print_message "$GREEN" "🎉 Deployment complete! Visit https://livefootball.lat"
echo ""

# Tail logs (optional - can be commented out)
# print_message "$BLUE" "📜 Following backend logs (Ctrl+C to exit)..."
# tail -f logs/backend.log
