/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const serverService = require('../services/serverService');

class ServerController {
    async getAll(req, res) {
        try {
            const servers = await serverService.getAllServers();
            res.json({ success: true, data: servers, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async getOne(req, res) {
        try {
            const server = await serverService.getServerById(req.params.id);
            if (!server) return res.status(404).json({ success: false, data: null, error: 'Server not found' });
            res.json({ success: true, data: server, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async create(req, res) {
        try {
            const id = await serverService.createServer(req.body);
            res.status(201).json({ success: true, data: { id }, error: null });
        } catch (err) {
            res.status(400).json({ success: false, data: null, error: err.message });
        }
    }

    async update(req, res) {
        try {
            await serverService.updateServer(req.params.id, req.body);
            res.json({ success: true, data: { id: req.params.id }, error: null });
        } catch (err) {
            res.status(400).json({ success: false, data: null, error: err.message });
        }
    }

    async delete(req, res) {
        try {
            await serverService.deleteServer(req.params.id);
            res.json({ success: true, data: { id: req.params.id }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async executeCommand(req, res) {
        try {
            const result = await serverService.executeCommand(req.params.id, req.body.command);
            res.json({ success: true, data: result, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async checkConnection(req, res) {
        try {
            const status = await serverService.checkConnection(req.params.id);
            res.json({ success: true, data: { status }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new ServerController();
