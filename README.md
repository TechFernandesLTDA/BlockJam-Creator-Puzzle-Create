# BlockJam Creator — Puzzle & Create

A mobile-first block puzzle game with an integrated level editor and community feed. Players solve puzzles, create their own levels, and share them with the community via a TikTok-style vertical feed.

## Project Structure

```
blockjam-creator/
├── apps/
│   ├── mobile/          # React Native app
│   │   ├── src/
│   │   │   ├── app/         # Screens (tabs, game, auth)
│   │   │   ├── components/  # UI components (game, editor, feed, ads)
│   │   │   ├── engine/      # Game engine (GridLogic, GameEngine, etc.)
│   │   │   ├── stores/      # Zustand state management
│   │   │   ├── services/    # API and auth services
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── theme/       # Design system (colors, typography, spacing)
│   │   │   ├── types/       # TypeScript type definitions
│   │   │   └── utils/       # Helpers and constants
│   │   └── assets/          # Fonts, images, sounds, animations
│   │
│   └── backend/         # Fastify API server
│       └── src/
│           ├── routes/      # API endpoints
│           ├── db/          # Drizzle schema, migrations, seed
│           ├── services/    # Business logic (feed algorithm, rewards)
│           ├── middleware/   # Auth, rate limiting, validation
│           ├── jobs/        # Background jobs (BullMQ)
│           └── utils/       # Logger, errors, Redis client
│
├── packages/
│   └── shared/          # Shared types, constants, Zod validators
│
├── .github/workflows/   # CI/CD pipelines
├── docker-compose.yml   # Local dev with PostgreSQL + Redis
└── turbo.json           # Turborepo workspace config
```

## Tech Stack

### Mobile
- React Native 0.76+ (New Architecture)
- React Navigation 7.x
- Zustand 5.x (state management)
- React Native Reanimated 3.x (animations)
- React Native Paper 5.x (Material Design 3)

### Backend
- Fastify 5.x
- Drizzle ORM + PostgreSQL 16
- Redis 7.x (caching, rate limiting)
- BullMQ (background jobs)
- Firebase Auth

### Infrastructure
- Docker + Docker Compose
- GitHub Actions CI/CD
- EAS Build (mobile builds)

## Getting Started

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- Android Studio / Xcode (for mobile dev)

### Setup

```bash
# Install dependencies
npm install

# Start backend services (PostgreSQL + Redis)
docker compose up -d postgres redis

# Run database migrations
npm run db:migrate --workspace=apps/backend

# Seed the database
npm run db:seed --workspace=apps/backend

# Start backend dev server
npm run dev:backend

# Start mobile app (in another terminal)
npm run start --workspace=apps/mobile
```

## Game Mechanics

- **Grid**: 6x6 (easy), 8x8 (standard), 10x10 (hard)
- **Gameplay**: Place 3 random pieces per turn onto the grid
- **Scoring**: Clear full rows/columns for points (10pts per cell x combo multiplier)
- **Combos**: Clear multiple lines simultaneously for 2x-5x multipliers
- **UGC Levels**: Pre-filled grids with target lines and move limits

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/google | Google Sign-In |
| POST | /api/auth/guest | Guest login |
| GET | /api/feed | Community feed (paginated) |
| GET | /api/feed/featured | Featured levels |
| GET | /api/levels/:id | Level details |
| POST | /api/levels | Create level |
| POST | /api/likes/:levelId | Like a level |
| GET | /api/users/me | User profile |
| GET | /api/users/ranking | Creator leaderboard |
| POST | /api/rewards/claim-daily | Daily reward |

## License

Private - All rights reserved.
