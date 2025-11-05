# LiveFootball Insights - Quick Start Guide

## ⚡ Quick Setup (5 minutes)

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in a new terminal)
cd frontend
npm install
```

### 2. Setup Environment Variables

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/livefootball"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="change-this-to-a-random-string"
JWT_REFRESH_SECRET="change-this-to-another-random-string"
OPENAI_API_KEY="sk-your-key"
RAPIDAPI_KEY="your-key"
```

**Frontend** (`frontend/.env`):
```bash
cp frontend/.env.example frontend/.env
```

Content should be:
```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### 3. Setup Database

```bash
# Create database
createdb livefootball

# Run migrations
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Start Services

Make sure PostgreSQL and Redis are running:
```bash
# PostgreSQL (if not running)
brew services start postgresql  # macOS
# or
sudo systemctl start postgresql  # Linux

# Redis (if not running)
brew services start redis  # macOS
# or
sudo systemctl start redis  # Linux
```

### 5. Run the Application

**Terminal 1 - Backend**:
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

### 6. Open the App

Visit: **http://localhost:5173**

## 🎯 Testing the App

1. **Register an account** at `/register`
2. **Login** at `/login`
3. **View live matches** on the homepage
4. **Click on a match** to see details
5. **Generate AI insights** (requires login)

## 🔑 Getting API Keys

### OpenAI API Key
1. Go to https://platform.openai.com/
2. Sign in or create account
3. Go to API keys section
4. Create new secret key
5. Copy and paste into `.env`

### API-FOOTBALL Key (RapidAPI)
1. Go to https://rapidapi.com/api-football/api/api-football
2. Sign up for free account
3. Subscribe to API-FOOTBALL (free tier: 100 requests/day)
4. Copy your API key
5. Paste into `.env` as `RAPIDAPI_KEY`

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# If database doesn't exist
createdb livefootball
```

### Redis Connection Error
```bash
# Test Redis
redis-cli ping
# Should return: PONG

# Start Redis if needed
redis-server
```

### Port Already in Use
```bash
# Backend (port 3001)
lsof -ti:3001 | xargs kill -9

# Frontend (port 5173)
lsof -ti:5173 | xargs kill -9
```

### Prisma Errors
```bash
cd backend
rm -rf node_modules
npm install
npm run prisma:generate
```

## 📚 Key Features Available

✅ User authentication (register, login, JWT)
✅ Browse live matches
✅ Match details with events timeline
✅ AI-powered match insights (GPT-4o-mini)
✅ Real-time updates via WebSocket
✅ Responsive UI (mobile + desktop)
✅ Dark mode theme

## 🚀 Next Steps

See `README.md` for full documentation including:
- Complete API endpoints list
- WebSocket events
- Deployment guides (Railway + Vercel)
- Testing instructions
- Contributing guidelines

## ⚽ Enjoy tracking your favorite matches!
