/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const dockerService = require('../services/dockerService');

class DockerController {
    async list(req, res) {
        try {
            const containers = await dockerService.listContainers(req.params.serverId);
            res.json({ success: true, data: containers, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async start(req, res) {
        try {
            const { serverId, containerId } = req.body;
            await dockerService.startContainer(serverId, containerId);
            res.json({ success: true, data: { status: 'started' }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async stop(req, res) {
        try {
            const { serverId, containerId } = req.body;
            await dockerService.stopContainer(serverId, containerId);
            res.json({ success: true, data: { status: 'stopped' }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async restart(req, res) {
        try {
            const { serverId, containerId } = req.body;
            await dockerService.restartContainer(serverId, containerId);
            res.json({ success: true, data: { status: 'restarted' }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async remove(req, res) {
        try {
            const { serverId, containerId } = req.params;
            await dockerService.removeContainer(serverId, containerId);
            res.json({ success: true, data: { status: 'removed' }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async logs(req, res) {
        try {
            const { serverId, containerId } = req.params;
            const { tail } = req.query;
            const logs = await dockerService.getLogs(serverId, containerId, tail ? parseInt(tail) : 100);
            res.json({ success: true, data: logs, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new DockerController();
