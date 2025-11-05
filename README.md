# LiveFootball Insights

Real-time soccer match tracking platform with AI-powered analysis. Track live matches from major leagues, follow your favorite teams, and get intelligent match insights powered by GPT-4o-mini.

## Features

- **Live Match Tracking**: Real-time score updates from major leagues worldwide
- **AI-Powered Analysis**: Pre-match predictions, live commentary, halftime analysis, and post-match insights
- **Team Following**: Follow your favorite teams and get personalized notifications
- **Real-time Updates**: WebSocket connections for instant score and event updates
- **Beautiful UI**: Modern, responsive design with dark mode
- **Smart Caching**: Redis-powered caching for optimal performance

## Tech Stack

### Backend
- Node.js 20+ with TypeScript
- Express.js
- Prisma (PostgreSQL ORM)
- Redis (caching)
- Socket.io (real-time)
- JWT authentication
- OpenAI GPT-4o-mini
- API-FOOTBALL (RapidAPI)

### Frontend
- React 18 with TypeScript
- Vite
- Tailwind CSS
- Zustand (state management)
- React Router v6
- Socket.io-client
- Axios

## Prerequisites

- Node.js 20 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher
- API-FOOTBALL API key (from RapidAPI)
- OpenAI API key

## Getting Started

### 1. Clone and Install

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set up PostgreSQL

```bash
# Create database
createdb livefootball

# Or using psql
psql -U postgres
CREATE DATABASE livefootball;
```

### 3. Set up Redis

```bash
# macOS (using Homebrew)
brew install redis
brew services start redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server
sudo systemctl start redis

# Or run with Docker
docker run -d -p 6379:6379 redis:7-alpine
```

### 4. Configure Environment Variables

**Backend** (`backend/.env`):

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/livefootball"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_EXPIRY="15m"
JWT_REFRESH_EXPIRY="7d"

OPENAI_API_KEY="sk-your-openai-api-key"

RAPIDAPI_KEY="your-rapidapi-key"
RAPIDAPI_HOST="api-football-v1.p.rapidapi.com"

FRONTEND_URL="http://localhost:5173"
NODE_ENV="development"
PORT=3001
```

**Frontend** (`frontend/.env`):

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

### 5. Initialize Database

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# (Optional) Seed database
npm run prisma:seed
```

### 6. Run the Application

**Terminal 1 - Backend**:

```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

**Terminal 2 - Frontend**:

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

## API Keys Setup

### Get API-FOOTBALL Key

1. Go to [RapidAPI](https://rapidapi.com/)
2. Sign up for an account
3. Subscribe to [API-FOOTBALL](https://rapidapi.com/api-football/api/api-football)
4. Copy your API key from the dashboard
5. Free tier includes 100 requests/day

### Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API keys section
4. Create a new API key
5. Copy and save it securely

## Project Structure

```
futbolito/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, Redis configs
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Auth, error handling
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── websocket/       # Socket.io server
│   │   ├── utils/           # Utilities
│   │   ├── types/           # TypeScript types
│   │   ├── prisma/          # Prisma schema, seeds
│   │   └── index.ts         # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API services
│   │   ├── hooks/           # Custom hooks
│   │   ├── utils/           # Utilities
│   │   ├── types/           # TypeScript types
│   │   └── main.tsx         # Entry point
│   └── package.json
│
├── specs.json              # Project specifications
└── README.md              # This file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user (protected)

### Matches
- `GET /api/matches/live` - Get live matches
- `GET /api/matches/:id` - Get match details
- `GET /api/matches/:id/insights` - Get match AI insights
- `POST /api/matches/:id/insights` - Generate AI insight (protected)

### Teams
- `GET /api/teams/search?q=query` - Search teams
- `POST /api/teams/:id/follow` - Follow team (protected)
- `DELETE /api/teams/:id/follow` - Unfollow team (protected)

### Users
- `GET /api/users/me/following` - Get followed teams (protected)

## WebSocket Events

### Client → Server
- `subscribe_match` - Subscribe to match updates
- `unsubscribe_match` - Unsubscribe from match
- `subscribe_team` - Subscribe to team updates

### Server → Client
- `match_update` - Real-time score update
- `match_event` - Goal, card, substitution event
- `match_started` - Match has started
- `match_ended` - Match finished
- `ai_insight` - New AI insight generated

## Development

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Database Management

```bash
# Open Prisma Studio (database GUI)
npm run prisma:studio

# Create new migration
npm run prisma:migrate

# Reset database
npx prisma migrate reset
```

## Deployment

### Backend (Railway)

1. Create account on [Railway](https://railway.app/)
2. Create new project
3. Add PostgreSQL and Redis services
4. Deploy backend from GitHub
5. Set environment variables
6. Deploy!

### Frontend (Vercel)

1. Create account on [Vercel](https://vercel.com/)
2. Import GitHub repository
3. Set root directory to `frontend`
4. Add environment variables
5. Deploy!

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1"

# Check connection string format
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# Check Redis is running
redis-cli
> INFO server
```

### API Rate Limits

API-FOOTBALL free tier has 100 requests/day. The app implements aggressive caching to minimize API calls:

- Live matches: Cached for 30 seconds
- Match details: Cached for 1 minute (live) or 1 hour (finished)
- Team data: Cached for 24 hours

## Contributing

This is a learning project. Feel free to fork and experiment!

## License

MIT

## Support

For issues or questions, please create an issue in the GitHub repository.

---

Built with ⚽ by Claude Code
