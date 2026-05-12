<div align="center">

# 🛡️ Detect Backend Threat

### Production-Grade Cyber Intelligence & Infrastructure Defense Platform

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=for-the-badge&logo=redis)](https://redis.io/)

> **Cyberpunk-themed real-time threat detection platform** with a live attack globe, threat scanner, infrastructure heatmap, and SOC incident center — fully containerized and production-ready.

</div>

---

## ✨ Features

| # | Feature | Description |
|---|---------|-------------|
| 🌐 | **Live Attack Globe** | Three.js WebGL globe with real-time animated attack arcs — DDoS (red), Malware (amber), Brute-Force (cyan) |
| 🔍 | **Threat Scanner** | Scan files with ClamAV, URLs with URLScan.io, hashes with VirusTotal — D3.js radar chart analysis |
| 🗺️ | **Infrastructure Heatmap** | D3.js force-directed graph of your servers/APIs/DBs colored by live risk score |
| 📡 | **Live Threat Feed** | Terminal-style real-time event stream via Redis pub/sub + Socket.io with sound alerts |
| 🚫 | **API Abuse Detector** | Auto-detects API floods & brute-force attacks, blocks IPs, AbuseIPDB lookup + D3 charts |
| ⚠️ | **Incident Command Center** | SOC-style incident queue with Gemini AI summaries and DETECTED → RESOLVED workflow |

---

## 🖥️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14 (App Router) + TailwindCSS + Framer Motion |
| **3D / Charts** | Three.js (WebGL globe) + D3.js (force graph, radar, timeline) |
| **Backend** | Node.js + Express + TypeScript |
| **Database** | PostgreSQL 16 via Prisma ORM |
| **Cache + Realtime** | Redis pub/sub → Socket.io WebSockets |
| **File Scanning** | ClamAV (Dockerized) |
| **Threat Intel** | VirusTotal API v3 + AbuseIPDB + URLScan.io |
| **AI** | Google Gemini (incident summarization) |
| **Observability** | Prometheus metrics + Grafana dashboards |
| **Containers** | Docker Compose (8 services) |

---

## 📋 Prerequisites

Before you start, make sure you have these installed on your machine:

- 🐳 **Docker Desktop** → [Download here](https://www.docker.com/products/docker-desktop/)
- 🔑 **API Keys** (free tiers are enough) — see table below
- 💻 **Git** → [Download here](https://git-scm.com/)

### 🔑 API Keys You Need

| Service | Where to Get It | Free Limit | Used For |
|---------|----------------|------------|---------|
| **VirusTotal** | [virustotal.com/gui/my-apikey](https://www.virustotal.com/gui/my-apikey) | 500 req/day | Hash & URL malware lookup |
| **AbuseIPDB** | [abuseipdb.com/register](https://www.abuseipdb.com/register) → API | 1,000 req/day | IP reputation scoring |
| **URLScan.io** | [urlscan.io/user/signup](https://urlscan.io/user/signup) → API Keys | 100 scans/day | URL screenshot + verdict |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Free tier | AI incident summaries |

---

## 🚀 Quick Start — Step by Step

### Step 1 — Clone the Repository

```bash
git clone https://github.com/vignesh2027/backend-optimization.git
cd backend-optimization
```

---

### Step 2 — Set Up Your Environment File

Copy the example env file:

```bash
cp .env.example .env
```

Now open `.env` in any text editor and fill in your API keys:

```bash
# Open with nano (terminal)
nano .env

# Or open with VS Code
code .env
```

Your `.env` file should look like this:

```env
# ── Database ──────────────────────────────────
POSTGRES_USER=dbt
POSTGRES_PASSWORD=dbtpass
POSTGRES_DB=detectthreat
DATABASE_URL=postgresql://dbt:dbtpass@localhost:5432/detectthreat

# ── Redis ─────────────────────────────────────
REDIS_PASSWORD=redispass
REDIS_URL=redis://:redispass@localhost:6379

# ── API Keys (paste yours here) ───────────────
VIRUSTOTAL_API_KEY=your_virustotal_key_here
ABUSEIPDB_API_KEY=your_abuseipdb_key_here
URLSCAN_API_KEY=your_urlscan_key_here
GEMINI_API_KEY=your_gemini_key_here

# ── App ───────────────────────────────────────
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
PORT=4000
NODE_ENV=production
```

> ⚠️ **Never commit your `.env` file to GitHub.** It's already in `.gitignore` so you're safe.

---

### Step 3 — Start Everything with Docker

```bash
docker compose up -d
```

This single command starts **8 containers**:

| Container | What It Does | Port |
|-----------|-------------|------|
| `dbt-frontend` | Next.js cyberpunk UI | 3000 |
| `dbt-backend` | Express API + WebSocket | 4000 |
| `dbt-postgres` | PostgreSQL database | 5432 |
| `dbt-redis` | Redis pub/sub + cache | 6379 |
| `dbt-clamav` | Antivirus file scanner | 3310 |
| `dbt-prometheus` | Metrics collection | 9090 |
| `dbt-grafana` | Metrics dashboards | 3001 |

> ⏳ **First run takes 5–10 minutes** — Docker needs to download and build all images. Subsequent starts take under 30 seconds.

---

### Step 4 — Wait for All Containers to Be Healthy

Check that everything is running:

```bash
docker compose ps
```

You should see all containers showing `Up` or `Up (healthy)`:

```
NAME             STATUS
dbt-backend      Up
dbt-clamav       Up (healthy)
dbt-frontend     Up
dbt-grafana      Up
dbt-postgres     Up (healthy)
dbt-prometheus   Up
dbt-redis        Up (healthy)
```

> ⚠️ If the backend shows `Restarting`, wait 30 seconds and check again. It waits for PostgreSQL and Redis to be ready first.

---

### Step 5 — Initialize the Database

Run this once to create all the database tables:

```bash
docker compose exec backend npx prisma db push
```

You should see:
```
✔ Your database is now in sync with your Prisma schema.
```

---

### Step 6 — Load Demo Data (Optional but Recommended)

Seed the Incident Command Center with 3 realistic demo incidents:

```bash
curl -X POST http://localhost:4000/api/incidents/seed
```

---

### Step 7 — Open Your Platform 🎉

| Service | URL | Login |
|---------|-----|-------|
| 🛡️ **Main Platform** | **http://localhost:3000** | — |
| ⚙️ Backend API | http://localhost:4000 | — |
| 📊 Grafana Dashboards | http://localhost:3001 | admin / admin123 |
| 📈 Prometheus Metrics | http://localhost:9090 | — |

---

## 🗺️ Platform Pages

### 🌐 Attack Globe — `http://localhost:3000`
- Real-time WebGL globe with animated attack arcs
- Color-coded by attack type (DDoS=red, Malware=amber, Brute-Force=cyan)
- Controls: pause/resume, filter by type, drag to rotate
- Live feed of recent attacks in the top-right panel

### 🔍 Threat Scanner — `http://localhost:3000/scanner`
- **Hash Lookup**: paste any MD5/SHA1/SHA256 hash → VirusTotal results
- **URL Scan**: paste any URL → URLScan.io screenshot + verdict
- **File Scan**: upload any file → ClamAV antivirus scan
- D3.js radar chart shows threat across 6 dimensions

### 🗺️ Infrastructure Heatmap — `http://localhost:3000/infrastructure`
- Interactive force-directed graph of your infrastructure
- Node color = risk score (green → amber → red)
- Click any node to see CPU, memory, latency P99, open ports

### 📡 Live Threat Feed — `http://localhost:3000/feed`
- Terminal-style scrolling event stream
- Filter by severity: CRITICAL / HIGH / MEDIUM / LOW
- Toggle sound alerts for CRITICAL events
- Pause/resume the feed at any time

### 🚫 API Abuse Detector — `http://localhost:3000/abuse`
- D3.js timeline chart: requests per minute over last 30 min
- D3.js bar chart: top 10 most abusive IPs
- IP lookup: paste any IP to check AbuseIPDB score
- View and manage the auto-blocked IP list

### ⚠️ Incident Command Center — `http://localhost:3000/incidents`
- SOC-style incident queue sorted by severity (CRITICAL first)
- Click **"SEED DEMO"** to load 3 realistic sample incidents
- Click **"✦ AI SUMMARY"** on any incident for a Gemini AI analysis
- Status workflow: DETECTED → INVESTIGATING → CONTAINED → RESOLVED

---

## 🛑 Stopping the Platform

```bash
# Stop all containers (keeps your data)
docker compose down

# Stop AND delete all data (fresh start)
docker compose down -v
```

---

## 🔧 Troubleshooting

### Backend keeps restarting
```bash
docker compose logs backend --tail=30
```
Usually means database tables aren't created yet. Run:
```bash
docker compose exec backend npx prisma db push
```

### Globe shows no attacks
The backend might not have finished starting. Check:
```bash
docker compose logs backend --tail=20
```
Look for: `[Server] Running on port 4000`

### Port already in use error
Another app is using a port. Stop it or change the port in `docker-compose.yml`.

### On Apple Silicon Mac (M1/M2) — ClamAV error
Already handled — ClamAV runs via Rosetta emulation (`platform: linux/amd64`).

### Force a full clean rebuild
```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## 📁 Project Structure

```
detect-backend-threat/
├── 🐳 docker-compose.yml          # All 8 services
├── 📋 .env.example                # Copy this to .env
│
├── 🖥️  frontend/                  # Next.js 14 App Router
│   ├── app/
│   │   ├── page.tsx               # 🌐 Attack Globe
│   │   ├── scanner/page.tsx       # 🔍 Threat Scanner
│   │   ├── infrastructure/page.tsx # 🗺️ Infra Heatmap
│   │   ├── feed/page.tsx          # 📡 Live Feed
│   │   ├── abuse/page.tsx         # 🚫 Abuse Detector
│   │   └── incidents/page.tsx     # ⚠️ Incident Center
│   └── components/
│       ├── AttackGlobe.tsx        # Three.js WebGL globe
│       ├── InfraGraph.tsx         # D3 force graph
│       ├── ThreatRadar.tsx        # D3 radar chart
│       └── Sidebar.tsx            # Navigation
│
├── ⚙️  backend/                   # Node.js + Express
│   ├── src/
│   │   ├── index.ts               # Server entry + Prometheus
│   │   ├── routes/                # scan, incidents, abuse, infra
│   │   ├── services/              # virustotal, urlscan, abuseipdb, gemini, clamav
│   │   ├── middleware/            # requestLogger, ipBlock
│   │   └── websocket/             # Socket.io + Redis pub/sub
│   └── prisma/schema.prisma       # DB schema
│
├── 📊 prometheus/prometheus.yml   # Metrics scrape config
└── 📈 grafana/provisioning/       # Auto-provisioned dashboards
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/scan/file` | ClamAV file scan (multipart) |
| `POST` | `/api/scan/url` | URLScan.io URL scan |
| `POST` | `/api/scan/hash` | VirusTotal hash lookup |
| `GET` | `/api/scan/history` | Recent scan results |
| `GET` | `/api/incidents` | All incidents (priority sorted) |
| `POST` | `/api/incidents` | Create new incident |
| `PATCH` | `/api/incidents/:id/status` | Update incident status |
| `POST` | `/api/incidents/:id/summarize` | Generate Gemini AI summary |
| `POST` | `/api/incidents/seed` | Load demo incidents |
| `GET` | `/api/abuse/stats` | Request rate stats + top IPs |
| `POST` | `/api/abuse/check-ip` | AbuseIPDB IP lookup |
| `GET` | `/api/abuse/blocked` | List blocked IPs |
| `DELETE` | `/api/abuse/blocked/:ip` | Unblock an IP |
| `GET` | `/api/infrastructure/topology` | Force graph node/link data |
| `GET` | `/metrics` | Prometheus metrics endpoint |
| `GET` | `/health` | Health check |

---

## 🎨 Design System

The platform uses a **cyberpunk dark theme**:

| Token | Color | Usage |
|-------|-------|-------|
| Background | `#0a0a0f` | Page base |
| Panel | `#0d0d1a` | Glass panels |
| Neon Cyan | `#00f5ff` | Primary accent, borders |
| Neon Green | `#39ff14` | Safe/clean/online |
| Threat Red | `#ff2d55` | Critical threats, DDoS |
| Threat Amber | `#ff9500` | Malware, warnings |
| Font | JetBrains Mono | All text |

CSS effects: glassmorphism panels, CRT scanline animation, neon glow shadows, animated attack arcs.

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

<div align="center">

**Built with ❤️ · Cyberpunk theme · Production ready**

⭐ Star this repo if you found it useful!

</div>
