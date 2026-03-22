const proxmoxService = require('../services/proxmoxService');

class ProxmoxController {
    async getNodes(req, res) {
        try {
            const nodes = await proxmoxService.getNodes(req.params.serverId);
            res.json({ success: true, data: nodes, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async getVMs(req, res) {
        try {
            const vms = await proxmoxService.getVMs(req.params.serverId, req.params.node);
            res.json({ success: true, data: vms, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async controlVM(req, res) {
        try {
            const { serverId, node, type, vmid, action } = req.body;
            const result = await proxmoxService.controlVM(serverId, node, type, vmid, action);
            res.json({ success: true, data: result, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new ProxmoxController();
