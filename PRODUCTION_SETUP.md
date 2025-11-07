# 🚀 Quick Production Setup - livefootball.lat

**TL;DR:** Complete guide to deploy LiveFootball on your domain using ngrok.

---

## 🎯 What You Need

1. **ngrok Paid Plan** (Pro $10/mo minimum) - Free plan doesn't support custom domains
2. **Domain:** livefootball.lat (Already owned on Namecheap)
3. **Server:** Local machine running 24/7
4. **Services:** PostgreSQL + Redis

---

## ⚡ Quick Start (5 Steps)

### 1. Configure ngrok Auth Token

```bash
# Get token from: https://dashboard.ngrok.com/get-started/your-authtoken
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 2. Update ngrok.yml

Edit `ngrok.yml` and replace `YOUR_AUTH_TOKEN_HERE` with your actual token.

### 3. Add Domain to ngrok Dashboard

1. Go to: https://dashboard.ngrok.com/cloud-edge/domains
2. Click **"+ New Domain"**
3. Enter: `livefootball.lat`
4. Copy the DNS records provided

### 4. Configure Namecheap DNS

1. Login to Namecheap: https://www.namecheap.com
2. Go to: **Domain List** → **Manage** → **Advanced DNS**
3. Add CNAME record:
   - **Type:** CNAME
   - **Host:** @
   - **Value:** [ngrok endpoint from dashboard]
   - **TTL:** Automatic

Wait 5-30 minutes for DNS propagation.

### 5. Start Production

```bash
# Make sure PostgreSQL and Redis are running
sudo systemctl start postgresql
redis-server &

# Start the application
./start-production.sh
```

**That's it!** Visit: https://livefootball.lat

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `DEPLOYMENT.md` | Complete deployment guide with troubleshooting |
| `ngrok.yml` | ngrok tunnel configuration |
| `start-production.sh` | Startup script (builds + runs everything) |
| `stop-production.sh` | Shutdown script |
| `frontend/.env.production` | Frontend production env vars |
| `backend/.env` | Backend env vars (all environments) |

---

## 🔧 Environment Configuration

### Backend `.env`

```env
NODE_ENV=production
PORT=3456
DATABASE_URL=postgresql://livefootball:password@localhost:5432/livefootball
REDIS_URL=redis://localhost:6379
FOOTBALL_DATA_API_KEY=your-key
OPENAI_API_KEY=your-key
JWT_SECRET=change-this-in-production
JWT_REFRESH_SECRET=change-this-in-production
FRONTEND_URL=https://livefootball.lat
```

### Frontend `.env.production`

```env
VITE_API_URL=https://livefootball.lat/api
```

---

## 🛠️ Manual Start (Alternative)

If you prefer manual control:

```bash
# Build
cd frontend && npm run build && cd ..
cd backend && npm run build && cd ..

# Start backend
cd backend
NODE_ENV=production npm start &

# Start ngrok
ngrok start --config ngrok.yml livefootball
```

---

## 🔍 Health Checks

```bash
# Backend health
curl https://livefootball.lat/health

# Sync status
curl https://livefootball.lat/api/sync/status

# ngrok tunnels
curl http://localhost:4040/api/tunnels
```

---

## 📊 What Gets Deployed

### Backend (Port 3456)
- Express API server
- Socket.IO WebSocket server
- Automated match sync service
- Serves frontend static files

### Frontend
- Built React SPA
- Optimized for production
- Served by backend in production

### ngrok
- HTTPS tunnel to localhost:3456
- Custom domain: livefootball.lat
- WebSocket support
- SSL/TLS termination

---

## 🛑 Stop Services

```bash
./stop-production.sh
```

---

## 🐛 Common Issues

### Domain doesn't resolve
- Wait 5-30 minutes for DNS propagation
- Check: `nslookup livefootball.lat`
- Verify DNS records in Namecheap match ngrok dashboard

### ngrok won't start
- Make sure you have a paid plan
- Check auth token is correct in `ngrok.yml`
- Verify domain is added in ngrok dashboard

### API calls fail
- Check backend is running: `curl http://localhost:3456/health`
- Verify `VITE_API_URL` in `frontend/.env.production`
- Rebuild frontend after changing env vars

### WebSocket doesn't connect
- Ensure ngrok tunnel is using HTTP protocol
- Check browser console for errors
- Verify Socket.IO CORS configuration

---

## 📈 Production Tips

1. **Use PM2 for process management:**
   ```bash
   npm install -g pm2
   pm2 start backend/dist/index.js --name livefootball
   ```

2. **Set up automatic restarts:**
   ```bash
   pm2 startup
   pm2 save
   ```

3. **Monitor logs:**
   ```bash
   tail -f logs/backend.log
   tail -f logs/ngrok.log
   ```

4. **Database backups:**
   ```bash
   pg_dump livefootball > backup-$(date +%Y%m%d).sql
   ```

---

## 💰 Cost Breakdown

| Service | Plan | Cost/mo | Required |
|---------|------|---------|----------|
| ngrok | Pro | $10 | ✅ Yes |
| Namecheap | Domain | $10-15 | ✅ Yes |
| Football-Data.org | Deep Data | €29 | ✅ Yes |
| OpenAI | API usage | ~$5-20 | ✅ Yes |
| **Total** | | **~$54-74/mo** | |

---

## 🎉 Success Checklist

- [ ] ngrok paid plan activated
- [ ] Auth token configured
- [ ] Domain added to ngrok dashboard
- [ ] DNS records configured in Namecheap
- [ ] DNS propagation complete (test with nslookup)
- [ ] PostgreSQL running
- [ ] Redis running
- [ ] Environment variables configured
- [ ] Application built successfully
- [ ] Backend started and healthy
- [ ] ngrok tunnel active
- [ ] Website accessible at https://livefootball.lat
- [ ] WebSocket connected
- [ ] Matches syncing automatically
- [ ] AI insights working

---

## 📚 Full Documentation

For complete details, troubleshooting, and advanced configuration:

**Read:** `DEPLOYMENT.md`

---

## 🆘 Need Help?

1. Check `DEPLOYMENT.md` for detailed troubleshooting
2. View logs: `logs/backend.log` and `logs/ngrok.log`
3. ngrok dashboard: https://dashboard.ngrok.com
4. ngrok local UI: http://localhost:4040

---

**Built with ❤️ for live football fans ⚽**
