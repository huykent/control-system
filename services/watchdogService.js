/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const serverRepository = require('../repositories/serverRepository');
const systemLogRepository = require('../repositories/systemLogRepository');
const sshService = require('./sshService');
const proxmoxService = require('./proxmoxService');

class WatchdogService {
    constructor() {
        this.alertedContainers = new Set(); // To prevent spam: serverId:containerId:state
        this.alertHistory = new Map(); // key -> timestamp
        this.COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
    }

    shouldAlert(key) {
        const now = Date.now();
        const lastAlert = this.alertHistory.get(key);
        if (lastAlert && (now - lastAlert < this.COOLDOWN_MS)) {
            return false;
        }
        this.alertHistory.set(key, now);
        return true;
    }

    async checkAllServers() {
        const servers = await serverRepository.findAll();

        for (const server of servers) {
            let isOnline = false;
            let errorMsg = '';

            try {
                if (server.type === 'ubuntu') {
                    // Simple ping or command execution to check auth and connectivity
                    await sshService.execCommand(server, 'echo "ping"');
                    isOnline = true;
                } else if (server.type === 'proxmox') {
                    // Check if we can fetch nodes
                    const nodes = await proxmoxService.getNodes(server.id);
                    if (nodes && nodes.length > 0) {
                        isOnline = true;
                    }
                }
            } catch (err) {
                isOnline = false;
                errorMsg = err.message;
            }

            const newStatus = isOnline ? 'online' : 'offline';

            // If status changes, log it
            if (server.status !== newStatus) {
                await serverRepository.updateStatus(server.id, newStatus);

                if (newStatus === 'offline') {
                    const alertKey = `server:offline:${server.id}`;
                    const msg = `Server ${server.name} (${server.ip}) went OFFLINE. Error: ${errorMsg}`;
                    await systemLogRepository.create('error', `watchdog:${server.id}`, msg);

                    if (this.shouldAlert(alertKey)) {
                        const telegramService = require('./telegramService');
                        await telegramService.sendAlert(msg);
                    }
                } else {
                    await systemLogRepository.create('info', `watchdog:${server.id}`, `Server ${server.name} (${server.ip}) is back ONLINE.`);
                    this.alertHistory.delete(`server:offline:${server.id}`);
                }
            }

            // Check Docker Containers if server is online
            if (isOnline) {
                try {
                    await this.checkDockerContainers(server);
                } catch (dockerErr) {
                    console.error(`Error checking docker on ${server.name}:`, dockerErr.message);
                }
            }
        }
    }

    async checkDockerContainers(server) {
        const dockerService = require('./dockerService');
        const telegramService = require('./telegramService');

        const containers = await dockerService.listContainers(server.id);

        for (const container of containers) {
            // Check for failures: restarting, exited with error, or has explicit error detail
            const isFailed = container.status === 'restarting' ||
                (container.status === 'exited' && container.error_detail) ||
                container.error_detail;

            const alertKey = `docker:fail:${server.id}:${container.container_id}`;

            if (isFailed) {
                if (this.shouldAlert(alertKey)) {
                    const alertMsg = `🐳 *Docker Container Failure* on *${server.name}*\n\n` +
                        `• Name: \`${container.name}\`\n` +
                        `• Image: \`${container.image}\`\n` +
                        `• Status: \`${container.status_text || container.status}\`\n` +
                        `• Error: \`${container.error_detail || 'Unknown error'}\``;

                    await telegramService.sendAlert(alertMsg);
                    await systemLogRepository.create('error', `watchdog:docker:${container.container_id}`, `Docker failure on ${server.name}: ${container.name} is ${container.status}`);
                }
            } else {
                // If it's healthy, remove from alerted list if it was there
                this.alertHistory.delete(alertKey);
            }
        }
    }
}

module.exports = new WatchdogService();
