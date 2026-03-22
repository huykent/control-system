# LAN Control System

A production-ready Local Area Network Infrastructure Manager. Built with the **Antigravity Workflow** and strict **3-Layer Architecture**.

## Architecture Layers
- **Presentation Layer**: Express Controllers & Sockets
- **Business Logic Layer**: Services (SSH, Docker, Proxmox, Metrics)
- **Data Layer**: Repositories (SQLite persistence)

## Tech Stack
- **Backend**: Node.js, Express, Socket.io, SSH2, Dockerode
- **Database**: SQLite
- **Frontend**: React, Vite, TailwindCSS, Xterm.js, React Query, Recharts

## System Requirements
- `arp-scan` (for LAN discovery)
- SSH enabled on remote servers
- Node.js 18+

## Quick Start

### 1. Installation
```bash
# Clone the repository
git clone <repo-url>
cd lan-control-system

# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 2. Database Migration
```bash
# Run migration from the root directory
num run migrate
```

### 3. Run Development Servers
**Backend:**
```bash
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

## Security Note
This system is designed to run **100% locally** in your network. It does not have cloud dependencies and should not be exposed to the public internet without a VPN or reverse proxy with authentication.

## License
MIT
