/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const nodeCron = require('node-cron');

const serverRoutes = require('./routes/serverRoutes');
const dockerRoutes = require('./routes/dockerRoutes');
const proxmoxRoutes = require('./routes/proxmoxRoutes');
const discoveryRoutes = require('./routes/discoveryRoutes');
const metricsService = require('./services/metricsService');
const setupTerminalSocket = require('./sockets/terminalSocket');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
    }
});

// Setup Terminal
setupTerminalSocket(io);

// Inject IO into LanScanner
const lanScanner = require('./discovery/lanScanner');
lanScanner.setIo(io);

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/servers', serverRoutes);
app.use('/api/docker', dockerRoutes);
app.use('/api/proxmox', proxmoxRoutes);
app.use('/api/discovery', discoveryRoutes);
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/api/dashboard', dashboardRoutes);
const systemLogRoutes = require('./routes/systemLogRoutes');
app.use('/api/logs', systemLogRoutes);
const settingsRoutes = require('./routes/settingsRoutes');
app.use('/api/settings', settingsRoutes);
const sshKeyRoutes = require('./routes/sshKeyRoutes');
app.use('/api/ssh-keys', sshKeyRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve frontend static files (production)
const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist, {
    maxAge: '7d',
    etag: true,
}));
// SPA fallback — all non-API routes serve index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// Sockets (minimal logging)
io.on('connection', (socket) => {
    socket.on('disconnect', () => { });
});

// Periodic Metrics Collection (every 30 seconds, only when clients connected)
nodeCron.schedule('*/30 * * * * *', async () => {
    if (io.engine.clientsCount === 0) return;
    try {
        const results = await metricsService.collectAll();
        io.emit('metrics:update', results);
    } catch (err) {
        console.error('Metrics collection failed:', err.message);
    }
});

// Watchdog: Check server health every 60 seconds
const watchdogService = require('./services/watchdogService');
nodeCron.schedule('*/60 * * * * *', async () => {
    try {
        await watchdogService.checkAllServers();
    } catch (err) {
        console.error('Watchdog error:', err.message);
    }
});

const PORT = process.env.PORT || 3000;

// Daily cleanup: remove metrics older than 7 days (at 3 AM)
const metricsRepository = require('./repositories/metricsRepository');
nodeCron.schedule('0 3 * * *', async () => {
    try {
        const deleted = await metricsRepository.deleteOldMetrics(7);
        if (deleted > 0) console.log(`Cleaned up ${deleted} old metric records`);
    } catch (err) {
        console.error('Metrics cleanup failed:', err.message);
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`LAN Control System running on port ${PORT}`);
    const telegramService = require('./services/telegramService');
    telegramService.initBot().catch(err => console.error('Failed to init Telegram bot:', err));
});
