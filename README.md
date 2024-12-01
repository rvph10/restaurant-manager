# Restaurant Management System

A comprehensive solution for managing restaurant operations, including order processing, inventory management, and staff scheduling.

## Prerequisites

- Node.js 18.19.0 or higher
- Docker and Docker Compose
- PostgreSQL (if running locally)
- Redis (if running locally)

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/yourusername/restaurant-manager.git
cd restaurant-manager
```

2. Install dependencies:

```bash
npm install
cd frontend && npm install
cd ../backend && npm install
```

3. Start the development environment:

```bash
docker-compose up --build
```

4. Access the application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Prisma Studio: http://localhost:5555

## Development

- Backend runs on Express.js with TypeScript
- Frontend uses Next.js 14 with App Router
- Database: PostgreSQL with Prisma ORM
- Caching: Redis
- Authentication: JWT with Redis session storage

## Project Structure

```
.
├── backend/          # Express API
├── frontend/         # Next.js frontend
├── docker/          # Docker configurations
└── docs/            # Documentation
```

## Available Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run frontend`: Start frontend only
- `npm run backend`: Start backend only
- `npm run format`: Format code with Prettier
