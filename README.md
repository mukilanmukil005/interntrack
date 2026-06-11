# InternTrack – Internship Management System

A production-grade, multi-role internship lifecycle management platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js 20, Express 4, TypeScript 5 |
| ORM | Prisma 5 |
| Database | MySQL 8.x |
| Auth | JWT (access + refresh tokens) |
| Frontend | React 18, Vite 5, Tailwind CSS, ShadCN UI |
| State | Zustand |
| Charts | Recharts |
| Animations | Framer Motion |

## Roles
- **ADMIN** — Full system control
- **MENTOR** — Reviews assigned interns
- **INTERN** — Daily attendance, reports, projects

## Quick Start

### Prerequisites
- Node.js 20.x
- MySQL 8.x (or Docker)

### Backend
```bash
cd backend
cp .env.example .env          # Fill in your values
npm install
npm run db:generate           # Generate Prisma client
npm run db:migrate            # Run migrations
npm run db:seed               # Seed admin user
npm run dev                   # Start dev server → http://localhost:5000
```

### Frontend (Phase 10+)
```bash
cd frontend
npm install
npm run dev                   # → http://localhost:5173
```

## Default Admin Credentials (after seed)
- **Email:** admin@interntrack.com
- **Password:** Admin@1234

## API Health Check
```
GET http://localhost:5000/health
```

## Phase Progress
- [x] Phase 1 – Architecture & Planning
- [x] Phase 2 – Backend Foundation
- [ ] Phase 3 – Database Schema & Migrations
- [ ] Phase 4 – User & Program Management APIs
- [ ] Phase 5 – Attendance Module
- [ ] Phase 6 – Daily Reports Module
- [ ] Phase 7 – Project Management Module
- [ ] Phase 8 – Progress Tracking & Analytics
- [ ] Phase 9 – Certificate Generation
- [ ] Phase 10 – Notification System
- [ ] Phase 11 – Frontend Public Website
- [ ] Phase 12 – Admin Dashboard
- [ ] Phase 13 – Mentor Dashboard
- [ ] Phase 14 – Intern Dashboard
- [ ] Phase 15 – Testing & Deployment
