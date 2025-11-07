# Date & Timezone Handling Documentation

## Overview

The LiveFootball application properly handles dates and timezones to ensure users see match times in their local timezone. This document explains how it works and how to fetch matches for different date ranges.

## How Timezone Conversion Works

### Backend (UTC Storage)
- All match times are stored in **UTC (Coordinated Universal Time)** in the PostgreSQL database
- The Football-Data.org API provides times in UTC format (e.g., `2025-11-09T19:00:00.000Z`)
- Backend stores these times as-is without conversion

### Frontend (Automatic Local Time)
- The frontend uses `date-fns` library for date formatting
- When JavaScript creates a `new Date(utcString)`, it automatically converts to the user's local timezone
- The `format()` function displays times in the user's system timezone

### Example Conversion

**Stored in Database (UTC):**
```
2025-11-09T19:00:00.000Z
```

**Displayed to User (depends on location):**
- **New York (EST, UTC-5):** Nov 9, 2025 - 14:00
- **London (GMT, UTC+0):** Nov 9, 2025 - 19:00
- **Tokyo (JST, UTC+9):** Nov 10, 2025 - 04:00
- **Los Angeles (PST, UTC-8):** Nov 9, 2025 - 11:00

## Fetching Matches for Different Dates

### Problem: Why Only Today's Matches?

By default, the `/api/matches/sync` endpoint only fetches matches for **today's date**. This is to minimize API calls to the free tier (10 requests/minute).

### Solution: Use Date Range Sync

The application supports fetching matches for any date range using the sync script.

## Using the Match Sync Script

### Location
```bash
cd /home/daniel/Develop/live_football/backend
./sync-matches.sh
```

### Usage Options

#### 1. Sync Default Range (Recommended)
Syncs past 7 days + next 14 days:
```bash
./sync-matches.sh
```

#### 2. Sync Only Today
```bash
./sync-matches.sh today
```

#### 3. Sync Custom Day Range
Sync 3 days back and 10 days forward:
```bash
./sync-matches.sh 3 10
```

#### 4. Sync Specific Date Range
Sync entire November 2025:
```bash
./sync-matches.sh 2025-11-01 2025-11-30
```

#### 5. Get Help
```bash
./sync-matches.sh --help
```

## API Endpoints for Date Ranges

### 1. Sync Today's Matches
```bash
curl -X POST http://localhost:3456/api/matches/sync
```

### 2. Sync Date Range
```bash
curl -X POST http://localhost:3456/api/matches/sync/range \
  -H "Content-Type: application/json" \
  -d '{"dateFrom":"2025-11-01","dateTo":"2025-11-30"}'
```

### 3. Get Matches (with filters)
```bash
# Get all matches
curl http://localhost:3456/api/matches

# Get matches for specific date
curl "http://localhost:3456/api/matches?date=2025-11-09"

# Get matches for date range
curl "http://localhost:3456/api/matches?dateFrom=2025-11-01&dateTo=2025-11-30"

# Get matches with pagination
curl "http://localhost:3456/api/matches?page=1&limit=20"
```

## Frontend Date Display

The frontend automatically shows user-friendly dates:

### Today's Match
```
Today at 14:00
```

### Tomorrow's Match
```
Tomorrow at 19:00
```

### Future Match
```
Nov 15, 2025 - 20:30
```

## Best Practices

### 1. Regular Syncing
Set up a cron job to sync matches regularly:

```bash
# Edit crontab
crontab -e

# Add this line to sync every 6 hours
0 */6 * * * cd /home/daniel/Develop/live_football/backend && ./sync-matches.sh 2 7 >> /tmp/match-sync.log 2>&1
```

### 2. Rate Limiting
The free tier of football-data.org has **10 requests per minute**. Be careful:

- Each date range sync = 1 API call
- Fetching detailed match data = 1 API call per match
- Stay within limits to avoid being throttled

### 3. Caching
The application uses Redis caching:

- **Live matches:** Cached for 30 seconds
- **Match details:** Cached for 1 minute (live) or 1 hour (finished)
- **Team data:** Cached for 24 hours

## Testing Timezone Display

### Backend (stores UTC)
```bash
curl -s "http://localhost:3456/api/matches?limit=1" | jq '.data[0].matchDate'
# Output: "2025-11-09T19:00:00.000Z"
```

### Your System Timezone
```bash
date
# Shows your system's timezone

# Test conversion
date -d '2025-11-09T19:00:00.000Z'
# Shows time converted to your local timezone
```

### Frontend Display
Open http://localhost:5178/ and check match times - they should be in your local time!

## Troubleshooting

### Issue: Times Look Wrong

**Check your system timezone:**
```bash
timedatectl
# or
date +"%Z %z"
```

**Verify the conversion:**
```bash
# Take a UTC time from the API
UTC_TIME="2025-11-09T19:00:00.000Z"

# Convert to your local time
date -d "$UTC_TIME"
```

### Issue: Not Enough Matches

**Sync more dates:**
```bash
./sync-matches.sh 7 14  # Sync 7 days back, 14 days forward
```

**Check how many matches you have:**
```bash
curl -s http://localhost:3456/api/matches?limit=1 | jq '.pagination.total'
```

### Issue: Old Matches Showing

**Filter by date on frontend or:**
```bash
# Backend automatically orders by most recent first
curl "http://localhost:3456/api/matches?limit=20"
```

## Database Schema

### Match Date Storage
```sql
-- matchDate is stored as TIMESTAMP
-- Always in UTC
CREATE TABLE matches (
  ...
  match_date TIMESTAMP(3) NOT NULL,
  ...
);
```

## Summary

✅ **What Works:**
- ✅ Times stored in UTC (universal standard)
- ✅ Frontend automatically converts to user's local timezone
- ✅ Date-fns handles all timezone logic
- ✅ Users see times in their own timezone
- ✅ Can sync matches for any date range
- ✅ Flexible sync script for different needs

✅ **How to Get More Matches:**
1. Use the sync script: `./sync-matches.sh`
2. Or use the API: `/api/matches/sync/range`
3. Specify date ranges as needed

✅ **Timezone Display:**
- Works automatically
- No configuration needed
- Based on user's system timezone
- Verified and tested ✓

---

**Note:** The default `/api/matches/sync` endpoint only fetches today to save API quota. Use the sync script or date range endpoint for historical/future matches!
