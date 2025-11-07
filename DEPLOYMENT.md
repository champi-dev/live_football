# 🚀 Production Deployment Guide - livefootball.lat

This guide will help you deploy your LiveFootball application using your custom domain `livefootball.lat` with ngrok running locally.

## 📋 Prerequisites

### 1. ngrok Paid Plan

**Important:** Custom domains require an ngrok **paid plan** (Pro, Business, or Enterprise).

- Free plan: ❌ No custom domains
- Pro plan: ✅ 3 custom domains ($10/month)
- Business plan: ✅ 10 custom domains ($39/month)

**Check your plan:**
```bash
ngrok config check
```

**Sign up for paid plan:** https://dashboard.ngrok.com/billing/plan

### 2. ngrok Authentication

Get your auth token from: https://dashboard.ngrok.com/get-started/your-authtoken

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3. Domain Setup

You need access to your Namecheap account to configure DNS records.

---

## 🔧 Step 1: Configure ngrok with Custom Domain

### 1.1 Update ngrok.yml

Edit `ngrok.yml` and add your auth token:

```yaml
version: "2"
authtoken: YOUR_ACTUAL_AUTH_TOKEN_HERE  # Replace this!

tunnels:
  livefootball:
    addr: 3456
    proto: http
    domain: livefootball.lat
    inspect: true
```

### 1.2 Add Domain to ngrok Dashboard

1. Go to: https://dashboard.ngrok.com/cloud-edge/domains
2. Click **"+ New Domain"**
3. Enter: `livefootball.lat`
4. Click **"Create Domain"**

ngrok will provide you with DNS records to configure.

---

## 🌐 Step 2: Configure DNS in Namecheap

### 2.1 Login to Namecheap

1. Go to: https://www.namecheap.com/myaccount/login/
2. Login with your credentials
3. Navigate to **Domain List**
4. Click **"Manage"** next to `livefootball.lat`

### 2.2 Add DNS Records

Go to **Advanced DNS** tab and add the following records:

**Option A: Using CNAME (Recommended)**

| Type  | Host | Value | TTL |
|-------|------|-------|-----|
| CNAME | @ | YOUR-NGROK-ENDPOINT.ngrok-free.app | Automatic |
| CNAME | www | YOUR-NGROK-ENDPOINT.ngrok-free.app | Automatic |

**Option B: Using A Record**

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | [ngrok IP address] | Automatic |
| A | www | [ngrok IP address] | Automatic |

> **Note:** ngrok will show you the exact DNS records to add in their dashboard. Copy those values exactly.

### 2.3 Verify DNS Propagation

DNS changes can take 5-30 minutes to propagate. Check status:

```bash
# Check if DNS is resolving
nslookup livefootball.lat

# Or using dig
dig livefootball.lat
```

---

## 🏗️ Step 3: Build Production Code

### 3.1 Build Frontend

```bash
cd frontend
npm run build
```

This creates an optimized production build in `frontend/dist/`.

**Build output:**
- Minified JavaScript bundles
- Optimized CSS
- Compressed assets
- `index.html` entry point

### 3.2 Build Backend

```bash
cd ../backend
npm run build
```

This compiles TypeScript to JavaScript in `backend/dist/`.

**Build includes:**
- Compiled Node.js code
- Source maps for debugging
- Type definitions

---

## 🔐 Step 4: Configure Environment Variables

### 4.1 Backend Production Environment

Create `backend/.env.production`:

```env
# Server Configuration
NODE_ENV=production
PORT=3456
FRONTEND_URL=https://livefootball.lat

# Database
DATABASE_URL=postgresql://livefootball:password@localhost:5432/livefootball

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production

# External APIs
FOOTBALL_DATA_API_KEY=your-football-data-api-key
OPENAI_API_KEY=your-openai-api-key

# CORS & Security
ALLOWED_ORIGINS=https://livefootball.lat
```

### 4.2 Frontend Production Environment

Already created in `frontend/.env.production`:

```env
VITE_API_URL=https://livefootball.lat/api
```

---

## 🚀 Step 5: Start Production Server

### 5.1 Using the Startup Script

We've created a convenient script to start everything:

```bash
chmod +x start-production.sh
./start-production.sh
```

This script will:
1. Check dependencies
2. Build frontend
3. Build backend
4. Start backend server (with frontend static files)
5. Start ngrok tunnel
6. Display URLs and status

### 5.2 Manual Start (Alternative)

If you prefer to start services manually:

```bash
# Terminal 1: Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Terminal 2: Start Redis (if not running)
redis-server

# Terminal 3: Start Backend
cd backend
NODE_ENV=production npm start

# Terminal 4: Start ngrok
ngrok start --config ngrok.yml livefootball
```

---

## 📊 Step 6: Verify Deployment

### 6.1 Check Backend Health

```bash
curl https://livefootball.lat/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-07T19:30:00.000Z"
}
```

### 6.2 Check Sync Service

```bash
curl https://livefootball.lat/api/sync/status
```

Expected response:
```json
{
  "success": true,
  "data": {
    "isEnabled": true,
    "isRunning": true,
    "lastSyncTime": "2025-11-07T19:30:00.000Z",
    "syncCount": 100,
    "errorCount": 0,
    "uptime": 3600
  }
}
```

### 6.3 Check Frontend

Open in browser:
```
https://livefootball.lat
```

You should see:
- ✅ Home page loads
- ✅ Matches displayed
- ✅ Live updates working
- ✅ WebSocket connected
- ✅ AI insights available (when logged in)

### 6.4 Check ngrok Dashboard

Visit: https://dashboard.ngrok.com/observability/traffic-inspection

You should see:
- Live traffic from your domain
- HTTP requests and responses
- WebSocket connections
- No errors

---

## 🔒 Security Checklist

Before going live, ensure:

- [ ] Changed default JWT secrets
- [ ] Updated CORS allowed origins
- [ ] PostgreSQL password is strong
- [ ] Redis is password-protected (if exposed)
- [ ] API keys are not committed to git
- [ ] ngrok auth token is private
- [ ] Rate limiting is enabled
- [ ] HTTPS is enforced
- [ ] Environment variables are secure

---

## 📝 Monitoring & Maintenance

### View Backend Logs

```bash
# If using systemd
journalctl -u livefootball -f

# If running manually
cd backend
NODE_ENV=production npm start | tee production.log
```

### View ngrok Logs

```bash
# ngrok shows live traffic in the terminal
# Or check the web interface at:
http://localhost:4040
```

### Database Backups

```bash
# Backup PostgreSQL database
pg_dump livefootball > backup-$(date +%Y%m%d).sql

# Restore from backup
psql livefootball < backup-20251107.sql
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild
cd frontend && npm run build
cd ../backend && npm run build

# Restart server
# (If using systemd: sudo systemctl restart livefootball)
# (If manual: Ctrl+C and restart)
```

---

## 🐛 Troubleshooting

### Issue: Domain Not Resolving

**Symptoms:** `livefootball.lat` doesn't load

**Solutions:**
1. Check DNS propagation: `nslookup livefootball.lat`
2. Wait 5-30 minutes for DNS to propagate
3. Clear browser cache and try incognito mode
4. Verify ngrok tunnel is running: `curl http://localhost:4040/api/tunnels`

### Issue: API Requests Failing

**Symptoms:** Frontend loads but API calls fail

**Solutions:**
1. Check backend is running: `curl http://localhost:3456/health`
2. Verify CORS settings in `backend/src/index.ts`
3. Check frontend `.env.production` has correct `VITE_API_URL`
4. Rebuild frontend with correct API URL

### Issue: WebSocket Not Connecting

**Symptoms:** Live updates don't work

**Solutions:**
1. Check ngrok supports WebSockets (it does on paid plans)
2. Verify Socket.IO configuration in `backend/src/index.ts`
3. Check browser console for connection errors
4. Ensure ngrok tunnel is using HTTP (not TCP only)

### Issue: ngrok Tunnel Keeps Disconnecting

**Symptoms:** Tunnel drops every few hours

**Solutions:**
1. Ensure you have a paid ngrok plan
2. Free plan has 2-hour session limits
3. Check system isn't going to sleep
4. Use a process manager like `pm2` to restart automatically

### Issue: Matches Not Syncing

**Symptoms:** No new matches appearing

**Solutions:**
1. Check sync service status: `curl https://livefootball.lat/api/sync/status`
2. Verify Football-Data.org API key is valid
3. Check backend logs for sync errors
4. Manually trigger sync: `curl -X POST https://livefootball.lat/api/matches/sync`

---

## 🔄 Process Management (Optional but Recommended)

For production stability, use a process manager like **PM2**:

### Install PM2

```bash
npm install -g pm2
```

### Create PM2 Ecosystem File

`ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'livefootball-backend',
      script: './backend/dist/index.js',
      cwd: '/home/daniel/Develop/live_football',
      env: {
        NODE_ENV: 'production',
        PORT: 3456
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
    {
      name: 'ngrok-tunnel',
      script: 'ngrok',
      args: 'start --config ngrok.yml livefootball',
      autorestart: true,
      watch: false,
      error_file: './logs/ngrok-error.log',
      out_file: './logs/ngrok-out.log',
    }
  ]
};
```

### Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### PM2 Commands

```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Remove all apps
```

---

## 💡 Performance Tips

1. **Enable Compression:**
   Backend already serves compressed files

2. **Use CDN for Static Assets:**
   Consider Cloudflare for caching static files

3. **Database Connection Pooling:**
   Already configured in Prisma

4. **Redis Caching:**
   Already implemented for API responses

5. **Monitor Resource Usage:**
   ```bash
   htop              # CPU and RAM
   df -h             # Disk space
   pm2 monit         # If using PM2
   ```

---

## 📞 Support & Resources

- **ngrok Documentation:** https://ngrok.com/docs
- **ngrok Dashboard:** https://dashboard.ngrok.com
- **Namecheap Support:** https://www.namecheap.com/support/
- **Football-Data.org API:** https://www.football-data.org/documentation/api
- **Project Repository:** https://github.com/champi-dev/live_football

---

## 🎉 You're Live!

Once everything is set up:

1. Visit: **https://livefootball.lat**
2. Share with users
3. Monitor logs and performance
4. Enjoy your live football insights platform!

**Remember:**
- ngrok paid plan is required for custom domains
- Keep your server running 24/7 for continuous service
- Monitor sync status regularly
- Keep dependencies updated for security

Good luck with your deployment! ⚽🚀
