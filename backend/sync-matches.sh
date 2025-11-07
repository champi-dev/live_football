#!/bin/bash

# LiveFootball - Match Synchronization Script
# This script syncs matches from football-data.org API for specified date ranges

set -e

# Configuration
API_URL="http://localhost:3456"
DEFAULT_DAYS_BACK=7
DEFAULT_DAYS_FORWARD=14

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Function to sync matches for a date range
sync_date_range() {
    local date_from=$1
    local date_to=$2

    print_info "Syncing matches from $date_from to $date_to..."

    response=$(curl -s -X POST "$API_URL/api/matches/sync/range" \
        -H "Content-Type: application/json" \
        -d "{\"dateFrom\":\"$date_from\",\"dateTo\":\"$date_to\"}")

    success=$(echo "$response" | jq -r '.success')
    message=$(echo "$response" | jq -r '.message')
    count=$(echo "$response" | jq -r '.data | length')

    if [ "$success" = "true" ]; then
        print_success "$message"
        return 0
    else
        print_error "Failed to sync matches"
        echo "$response" | jq '.'
        return 1
    fi
}

# Function to sync today's matches only
sync_today() {
    print_info "Syncing today's matches..."

    response=$(curl -s -X POST "$API_URL/api/matches/sync")

    success=$(echo "$response" | jq -r '.success')
    message=$(echo "$response" | jq -r '.message')

    if [ "$success" = "true" ]; then
        print_success "$message"
        return 0
    else
        print_error "Failed to sync today's matches"
        echo "$response" | jq '.'
        return 1
    fi
}

# Get current date
TODAY=$(date +"%Y-%m-%d")

# Show help
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "LiveFootball Match Sync Script"
    echo ""
    echo "Usage:"
    echo "  ./sync-matches.sh                    Sync past week + next 2 weeks"
    echo "  ./sync-matches.sh today              Sync only today's matches"
    echo "  ./sync-matches.sh <days-back> <days-forward>"
    echo "  ./sync-matches.sh <date-from> <date-to>  Sync specific date range"
    echo ""
    echo "Examples:"
    echo "  ./sync-matches.sh                    # Sync 7 days back, 14 days forward"
    echo "  ./sync-matches.sh today              # Only today"
    echo "  ./sync-matches.sh 3 7                # 3 days back, 7 days forward"
    echo "  ./sync-matches.sh 2025-11-01 2025-11-30  # November 2025"
    echo ""
    echo "Note: Free tier of football-data.org has 10 requests/minute limit"
    exit 0
fi

# Sync only today
if [ "$1" = "today" ]; then
    sync_today
    exit $?
fi

# Determine date range
if [ -z "$1" ]; then
    # Default: sync past week and next 2 weeks
    DATE_FROM=$(date -d "$DEFAULT_DAYS_BACK days ago" +"%Y-%m-%d")
    DATE_TO=$(date -d "+$DEFAULT_DAYS_FORWARD days" +"%Y-%m-%d")
elif [ -n "$2" ]; then
    # Check if arguments are dates or day counts
    if [[ $1 =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
        # Arguments are dates
        DATE_FROM=$1
        DATE_TO=$2
    else
        # Arguments are day counts
        DAYS_BACK=$1
        DAYS_FORWARD=$2
        DATE_FROM=$(date -d "$DAYS_BACK days ago" +"%Y-%m-%d")
        DATE_TO=$(date -d "+$DAYS_FORWARD days" +"%Y-%m-%d")
    fi
else
    print_error "Invalid arguments. Use --help for usage information"
    exit 1
fi

echo ""
echo "╔════════════════════════════════════════════════╗"
echo "║      LiveFootball Match Sync                   ║"
echo "╚════════════════════════════════════════════════╝"
echo ""
print_info "Date Range: $DATE_FROM to $DATE_TO"
print_info "API Endpoint: $API_URL"
echo ""

# Perform sync
if sync_date_range "$DATE_FROM" "$DATE_TO"; then
    echo ""
    print_success "Match synchronization completed successfully!"

    # Show current match count
    print_info "Fetching current match statistics..."
    total=$(curl -s "$API_URL/api/matches?limit=1" | jq -r '.pagination.total')
    print_success "Total matches in database: $total"

    echo ""
    print_info "View matches at: http://localhost:5178/"
else
    echo ""
    print_error "Match synchronization failed!"
    exit 1
fi
