/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const serverRepository = require('../repositories/serverRepository');
const logRepository = require('../repositories/logRepository');
const sshService = require('./sshService');

class ServerService {
    async getAllServers() {
        const servers = await serverRepository.findAll();
        const metricsService = require('./metricsService'); // Lazy require to avoid circular deps

        for (let i = 0; i < servers.length; i++) {
            const latestMetric = await metricsService.getLatest(servers[i].id);
            if (latestMetric) {
                servers[i].cpu = latestMetric.cpu.toFixed(1) + '%';
                servers[i].ram = latestMetric.ram.toFixed(1) + '%';
            } else {
                servers[i].cpu = null;
                servers[i].ram = null;
            }
        }
        return servers;
    }

    async getServerById(id) {
        return await serverRepository.findById(id);
    }

    async createServer(serverData) {
        // Basic validation
        if (!serverData.name || !serverData.ip || !serverData.username) {
            throw new Error('Name, IP, and Username are required');
        }
        return await serverRepository.create(serverData);
    }

    async updateServer(id, serverData) {
        return await serverRepository.update(id, serverData);
    }

    async deleteServer(id) {
        await sshService.closeConnection(id);
        return await serverRepository.delete(id);
    }

    async executeCommand(id, command) {
        const server = await serverRepository.findById(id);
        if (!server) throw new Error('Server not found');

        const result = await sshService.execCommand(server, command);

        // Log the command
        await logRepository.create({
            server_id: id,
            command: command,
            output: result.stdout || result.stderr
        });

        return result;
    }

    async checkConnection(id) {
        const server = await serverRepository.findById(id);
        if (!server) throw new Error('Server not found');

        try {
            const result = await this.executeCommand(id, 'echo "online"');
            const status = result.stdout.trim() === 'online' ? 'online' : 'offline';
            await serverRepository.updateStatus(id, status);
            return status;
        } catch (err) {
            await serverRepository.updateStatus(id, 'offline');
            return 'offline';
        }
    }
}

module.exports = new ServerService();
