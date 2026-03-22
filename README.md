<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/License-MIT-green" />
</p>

# 🖥️ LAN Control System

> Lightweight, self-hosted infrastructure manager for your local network. Monitor servers, manage Docker containers, control Proxmox VMs — all from a single glassmorphism dashboard.

## ✨ Features

- **📊 Real-time Dashboard** — CPU, RAM, Disk metrics with live charts
- **🖧 Server Management** — Add/remove Ubuntu & Proxmox servers via SSH
- **🐳 Docker Control** — Start, stop, restart containers remotely
- **📦 Proxmox Integration** — View nodes, VMs, and LXC containers
- **🔍 LAN Discovery** — Auto-scan network for devices
- **🔑 SSH Key Manager** — Store and manage SSH keys securely
- **💬 Telegram Alerts** — Get notified when servers go offline
- **🖥️ Web Terminal** — SSH into servers directly from the browser
- **🛡️ Watchdog** — Automatic health monitoring with Docker failure detection

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                  Frontend                    │
│     React 18 · Tailwind · Glassmorphism     │
│     Recharts · Xterm.js · React Query       │
├─────────────────────────────────────────────┤
│               Express API                    │
│    Compression · Static Serve · Socket.IO   │
├──────────┬──────────┬───────────────────────┤
│ Services │ Repos    │ SQLite Database       │
│ SSH, Docker, Proxmox│ Metrics, Servers, Keys│
└──────────┴──────────┴───────────────────────┘
```

## 🚀 Quick Start

### Development

```bash
# Clone
git clone https://github.com/huykent/control-system.git
cd control-system

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Run database migration
npm run migrate

# Start (2 terminals)
npm run dev           # Backend → :3000
cd frontend && npm run dev  # Frontend → :5173
```

### Production (Single Process)

```bash
cd frontend && npm run build && cd ..
node server.js
# → http://localhost:3000 (API + Frontend)
```

## 🐳 Docker Deploy

```bash
# Build & run
docker compose up -d

# Check health
curl http://localhost:3000/health

# View logs
docker compose logs -f
```

Resource limits: **256MB RAM**, **0.5 CPU** — runs great on a Raspberry Pi.

## 📦 Deploy on Proxmox LXC

```bash
# On LXC container (Ubuntu 22.04, nesting=1)
git clone https://github.com/huykent/control-system.git /opt/lan-control
cd /opt/lan-control
chmod +x deploy-lxc.sh
./deploy-lxc.sh
```

> **LXC Config** — add `features: nesting=1,keyctl=1` to `/etc/pve/lxc/<CTID>.conf`

## ⚡ Performance Optimizations

| Optimization | Impact |
|---|---|
| Gzip compression on all responses | ~60% smaller payloads |
| Static frontend served from Express | 1 process instead of 2 |
| React.lazy() on all 8 pages | Initial load ~75KB gzipped |
| Vite manual chunks (vendor/charts/terminal) | Independent caching |
| Smart metrics: only polls when clients exist | ~66% less SSH overhead |
| Auto-cleanup: metrics older than 7 days | Prevents DB bloat |

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Xterm.js, React Query |
| **Backend** | Node.js, Express, Socket.IO, SSH2, Dockerode, node-cron |
| **Database** | SQLite |
| **Deploy** | Docker (Alpine multi-stage), Docker Compose |

## 🔒 Security

This system is designed to run **100% locally**. Do not expose to the public internet without a VPN or reverse proxy with authentication.

## 📄 License

MIT — Built by [Nguyễn Quang Huy](https://www.facebook.com/QuangHuy.Nguyennn/)
