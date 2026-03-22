/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const metricsRepository = require('../repositories/metricsRepository');
const serverRepository = require('../repositories/serverRepository');
const sshService = require('./sshService');
const proxmoxService = require('./proxmoxService');
const systemLogRepository = require('../repositories/systemLogRepository');

class MetricsService {
    async collectAll() {
        const servers = await serverRepository.findAll();
        const results = [];

        for (const server of servers) {
            if (server.type === 'ubuntu') {
                try {
                    const metrics = await this.collectUbuntuMetrics(server);
                    await metricsRepository.create({
                        server_id: server.id,
                        ...metrics
                    });
                    results.push({ id: server.id, status: 'success', metrics });
                } catch (err) {
                    console.error(`Failed to collect metrics for ${server.name}:`, err.message);
                    await systemLogRepository.create('error', `server:${server.id}`, `Metrics collection failed for ${server.name}: ${err.message}`);
                    results.push({ id: server.id, status: 'failed', error: err.message });
                }
            } else if (server.type === 'proxmox') {
                try {
                    const metrics = await this.collectProxmoxMetrics(server);
                    if (metrics) {
                        await metricsRepository.create({
                            server_id: server.id,
                            ...metrics
                        });
                        results.push({ id: server.id, status: 'success', metrics });
                    }
                } catch (err) {
                    console.error(`Failed to collect metrics for Proxmox ${server.name}:`, err.message);
                    await systemLogRepository.create('error', `server:${server.id}`, `Proxmox metrics failed for ${server.name}: ${err.message}`);
                    results.push({ id: server.id, status: 'failed', error: err.message });
                }
            }
        }
        return results;
    }

    async collectUbuntuMetrics(server) {
        // Collect CPU, RAM, Disk, Uptime using remote commands
        // This is a simplified version, in reality we might want more robust parsing
        const cmd = `
      echo "---CPU---" && top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}' && \
      echo "---RAM---" && free | grep Mem | awk '{print $3/$2 * 100.0}' && \
      echo "---DISK---" && df / | tail -1 | awk '{print $5}' | sed 's/%//' && \
      echo "---UPTIME---" && uptime -p
    `;

        const result = await sshService.execCommand(server, cmd);
        const output = result.stdout;

        const cpuMatch = output.match(/---CPU---\n([\d.]+)/);
        const ramMatch = output.match(/---RAM---\n([\d.]+)/);
        const diskMatch = output.match(/---DISK---\n([\d.]+)/);
        const uptimeMatch = output.match(/---UPTIME---\n(.+)/);

        return {
            cpu: cpuMatch ? parseFloat(cpuMatch[1]) : 0,
            ram: ramMatch ? parseFloat(ramMatch[1]) : 0,
            disk: diskMatch ? parseFloat(diskMatch[1]) : 0,
            uptime: uptimeMatch ? uptimeMatch[1].trim() : 'n/a'
        };
    }

    async collectProxmoxMetrics(server) {
        try {
            const nodes = await proxmoxService.getNodes(server.id);
            if (!nodes || nodes.length === 0) return null;

            // For simplicity, aggregate across all nodes or just pick the first one's stats
            let totalCpu = 0;
            let totalMem = 0;
            let totalMaxMem = 0;
            let maxUptime = 0;

            for (const node of nodes) {
                totalCpu += (node.cpu || 0); // CPU is 0.0-1.0 per core? or total load
                totalMem += (node.mem || 0);
                totalMaxMem += (node.maxmem || 0);
                if (node.uptime > maxUptime) maxUptime = node.uptime;
            }

            const avgCpu = (totalCpu / nodes.length) * 100; // roughly percentage
            const ramPct = totalMaxMem > 0 ? (totalMem / totalMaxMem) * 100 : 0;

            const hours = Math.floor(maxUptime / 3600);
            const minutes = Math.floor((maxUptime % 3600) / 60);

            return {
                cpu: parseFloat(avgCpu.toFixed(2)),
                ram: parseFloat(ramPct.toFixed(2)),
                disk: 0, // Could fetch disk from proxmox too
                uptime: `${hours}h ${minutes}m`
            };
        } catch (err) {
            console.error('Proxmox metrics error:', err.message);
            throw err;
        }
    }

    async getHistory(serverId, limit) {
        return await metricsRepository.findByServerId(serverId, limit);
    }

    async getLatest(serverId) {
        return await metricsRepository.getLatestByServerId(serverId);
    }
}

module.exports = new MetricsService();
