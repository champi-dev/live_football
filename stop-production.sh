#!/bin/bash

# LiveFootball Production Stop Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo "=========================================="
print_message "$BLUE" "🛑 Stopping LiveFootball Services"
echo "=========================================="
echo ""

# Stop backend
if [ -f "backend.pid" ]; then
    BACKEND_PID=$(cat backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        print_message "$YELLOW" "Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 2
        if kill -0 $BACKEND_PID 2>/dev/null; then
            print_message "$YELLOW" "Force stopping backend..."
            kill -9 $BACKEND_PID
        fi
        print_message "$GREEN" "✅ Backend stopped"
    else
        print_message "$YELLOW" "⚠️  Backend process not running"
    fi
    rm backend.pid
else
    print_message "$YELLOW" "⚠️  No backend.pid file found"
fi

# Stop ngrok
if [ -f "ngrok.pid" ]; then
    NGROK_PID=$(cat ngrok.pid)
    if kill -0 $NGROK_PID 2>/dev/null; then
        print_message "$YELLOW" "Stopping ngrok (PID: $NGROK_PID)..."
        kill $NGROK_PID
        sleep 2
        if kill -0 $NGROK_PID 2>/dev/null; then
            print_message "$YELLOW" "Force stopping ngrok..."
            kill -9 $NGROK_PID
        fi
        print_message "$GREEN" "✅ ngrok stopped"
    else
        print_message "$YELLOW" "⚠️  ngrok process not running"
    fi
    rm ngrok.pid
else
    print_message "$YELLOW" "⚠️  No ngrok.pid file found"
fi

echo ""
print_message "$GREEN" "✅ All services stopped"
echo ""
