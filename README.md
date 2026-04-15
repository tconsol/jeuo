# Athléon — Sports Ecosystem Platform

A full-stack MERN monorepo: venue booking + social + real-time scoring + tournaments.

## Architecture

```
/client      → Player/User React app (Vite + Tailwind)
/owner       → Venue Owner dashboard
/admin       → Admin panel
/server      → Express API server
/realtime    → Socket.io real-time server
/shared      → Shared types, constants, utilities
```

## Quick Start

```bash
npm install
cp server/.env.example server/.env
npm run seed
npm run dev
```