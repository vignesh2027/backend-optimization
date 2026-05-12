# 🛡 Detect Backend Threat

> Production-grade cyber intelligence and infrastructure defense platform.

**Cyberpunk dark theme · Six live features · Full Docker stack**

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) + TailwindCSS + Framer Motion |
| Visualization | Three.js (WebGL globe) + D3.js (force graph, radar, charts) |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Cache + Realtime | Redis pub/sub → Socket.io WebSockets |
| Scanning | ClamAV (Docker) + VirusTotal API v3 |
| Threat Intel | AbuseIPDB + URLScan.io + OpenPhish |
| AI | Google Gemini (incident summarization) |
| Observability | Prometheus metrics + Grafana dashboards |

---

## Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Live Attack Globe** | Three.js WebGL globe with real-time attack arcs (DDoS=red, Malware=amber, Brute-force=cyan) |
| 2 | **Threat Scanner** | File scan (ClamAV), URL scan (URLScan.io), hash lookup (VirusTotal) + D3 radar chart |
| 3 | **Infrastructure Heatmap** | D3 force-directed graph of nodes colored by risk score, click for metrics panel |
| 4 | **Live Threat Feed** | Terminal-style scrolling feed via Redis pub/sub → Socket.io, filter + sound alerts |
| 5 | **API Abuse Detector** | Middleware rate tracking, AbuseIPDB lookup, D3 timeline + bar charts, auto-block |
| 6 | **Incident Command Center** | SOC-style incident queue with Gemini AI summaries and status workflow |

---

## Quick Start

### 1. Clone & configure
```bash
git clone https://github.com/vignesh2027/backend-optimization.git
cd backend-optimization
cp .env.example .env
# Edit .env with your API keys
```

### 2. Run with Docker Compose
```bash
docker compose up -d
```

### 3. Access
| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin123) |

### 4. Initialize database & seed demo data
```bash
# Run Prisma migrations
docker compose exec backend npx prisma migrate deploy

# Seed incident demo data (via UI or API)
curl -X POST http://localhost:4000/api/incidents/seed
```

---

## API Keys Required

| Service | Get it at | Free tier |
|---------|-----------|-----------|
| VirusTotal | virustotal.com/gui/my-apikey | 500 req/day |
| AbuseIPDB | abuseipdb.com/register | 1,000 req/day |
| URLScan.io | urlscan.io/user/signup | 100 scans/day |
| Gemini | console.anthropic.com | Pay-per-use |

---

## Dev Mode (no Docker)

```bash
# Backend
cd backend && npm install && npm run db:push && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Requires: PostgreSQL on :5432, Redis on :6379

---

## Architecture

```
┌─────────────────────────────────────┐
│  Next.js 14 Frontend (port 3000)    │
│  Three.js Globe │ D3 Charts │ UI    │
└────────────────┬────────────────────┘
                 │ REST + WebSocket
┌────────────────▼────────────────────┐
│  Express Backend (port 4000)        │
│  /api/scan  /api/incidents          │
│  /api/abuse /api/infrastructure     │
│  Socket.io  /metrics (Prometheus)   │
└──────┬──────────┬───────────────────┘
       │          │
┌──────▼──┐  ┌───▼──────┐
│PostgreSQL│  │  Redis   │
│(Prisma) │  │ pub/sub  │
└─────────┘  └──────────┘
       │
┌──────▼──────────────────────────────┐
│  External APIs                      │
│  VirusTotal · AbuseIPDB · URLScan   │
│  Gemini AI · ClamAV (Docker)        │
└─────────────────────────────────────┘
```
