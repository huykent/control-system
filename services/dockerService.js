/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const Docker = require('dockerode');
const serverRepository = require('../repositories/serverRepository');
const dockerRepository = require('../repositories/dockerRepository');

class DockerService {
    constructor() {
        this.clients = new Map();
    }

    async getClient(server) {
        if (this.clients.has(server.id)) return this.clients.get(server.id);

        const docker = new Docker({
            protocol: 'ssh',
            host: server.ip,
            port: server.port || 22,
            username: server.username,
            password: server.password
        });
        this.clients.set(server.id, docker);
        return docker;
    }

    async listContainers(serverId) {
        const server = await serverRepository.findById(serverId);
        if (!server) throw new Error('Server not found');

        const docker = await this.getClient(server);
        const containers = await docker.listContainers({ all: true });

        // Sync with database
        const results = await Promise.all(containers.map(async c => {
            let errorText = null;
            let restartCount = 0;
            let statusText = c.Status; // e.g. "Restarting (1) 40 seconds ago" or "Up 2 hours"

            if (c.State === 'restarting' || c.State === 'exited') {
                try {
                    const container = docker.getContainer(c.Id);
                    const info = await container.inspect();
                    restartCount = info.RestartCount || 0;

                    if (info.State.Error) {
                        errorText = info.State.Error;
                    } else if (info.State.ExitCode && info.State.ExitCode !== 0) {
                        errorText = `Exited with code ${info.State.ExitCode}`;
                    }
                } catch (e) { }
            }

            return {
                server_id: serverId,
                container_id: c.Id,
                name: c.Names[0].replace(/^\//, ''),
                image: c.Image,
                status: c.State,
                status_text: statusText,
                error_detail: errorText,
                restart_count: restartCount
            };
        }));

        for (const res of results) {
            await dockerRepository.upsert(res);
        }

        // Cleanup orphaned
        const ids = results.map(r => r.container_id);
        await dockerRepository.deleteOrphaned(serverId, ids);

        return results;
    }

    async startContainer(serverId, containerId) {
        const server = await serverRepository.findById(serverId);
        const docker = await this.getClient(server);
        const container = docker.getContainer(containerId);
        return await container.start();
    }

    async stopContainer(serverId, containerId) {
        const server = await serverRepository.findById(serverId);
        const docker = await this.getClient(server);
        const container = docker.getContainer(containerId);
        return await container.stop();
    }

    async restartContainer(serverId, containerId) {
        const server = await serverRepository.findById(serverId);
        const docker = await this.getClient(server);
        const container = docker.getContainer(containerId);
        return await container.restart();
    }

    async removeContainer(serverId, containerId) {
        const server = await serverRepository.findById(serverId);
        const docker = await this.getClient(server);
        const container = docker.getContainer(containerId);

        let imageId = null;
        try {
            const info = await container.inspect();
            imageId = info.Image;
        } catch (e) { }

        // Deep remove: force kill if running, and delete associated volumes
        await container.remove({ force: true, v: true });

        // Also remove the image if possible
        if (imageId) {
            try {
                const image = docker.getImage(imageId);
                await image.remove({ force: true });
            } catch (e) {
                console.warn('Could not remove image for container', containerId, e.message);
            }
        }

        return true;
    }

    async getLogs(serverId, containerId, tail) {
        const server = await serverRepository.findById(serverId);
        const docker = await this.getClient(server);
        const container = docker.getContainer(containerId);

        const logs = await container.logs({
            stdout: true,
            stderr: true,
            tail: tail || 100,
            timestamps: true
        });

        // dockerode logs returns a Buffer usually, we need to convert it to string properly stringifying multiplexed streams
        return logs.toString('utf8');
    }
}

module.exports = new DockerService();
