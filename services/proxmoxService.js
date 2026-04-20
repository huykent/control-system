/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const axios = require('axios');
const https = require('https');
const serverRepository = require('../repositories/serverRepository');

class ProxmoxService {
    constructor() {
        this.agents = new Map();
    }

    getAgent(ip) {
        if (!this.agents.has(ip)) {
            this.agents.set(ip, axios.create({
                baseURL: `https://${ip}:8006/api2/json`,
                httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Often self-signed
            }));
        }
        return this.agents.get(ip);
    }

    async authenticate(serverId) {
        const server = await serverRepository.findById(serverId);
        if (!server) throw new Error('Server not found');

        const agent = this.getAgent(server.ip);

        // Proxmox usually uses Token or Ticket. Assume Token if '!' is present.
        if (server.username.includes('!')) {
            return {
                Authorization: `PVEAPIToken=${server.username}=${server.password}`
            };
        } else {
            // Password-based auth via ticket
            let username = server.username;
            if (!username.includes('@')) {
                username = username === 'root' ? 'root@pam' : `${username}@pve`;
            }

            try {
                const params = new URLSearchParams();
                params.append('username', username);
                params.append('password', server.password);

                const req = await agent.post('/access/ticket', params);

                const data = req.data.data;
                return {
                    Cookie: `PVEAuthCookie=${data.ticket}`,
                    CSRFPreventionToken: data.CSRFPreventionToken
                };
            } catch (err) {
                console.error('Proxmox auth error:', err.response?.data || err.message);
                throw new Error('Proxmox authentication failed');
            }
        }
    }

    async getNodes(serverId) {
        const headers = await this.authenticate(serverId);
        const server = await serverRepository.findById(serverId);
        const agent = this.getAgent(server.ip);

        const response = await agent.get('/nodes', { headers });
        return response.data.data;
    }

    async getVMs(serverId, node) {
        const headers = await this.authenticate(serverId);
        const server = await serverRepository.findById(serverId);
        const agent = this.getAgent(server.ip);

        const response = await agent.get(`/nodes/${node}/qemu`, { headers });
        const vms = response.data.data;

        const lxcResponse = await agent.get(`/nodes/${node}/lxc`, { headers });
        const lxcs = lxcResponse.data.data;

        return [...vms.map(v => ({ ...v, type: 'qemu' })), ...lxcs.map(l => ({ ...l, type: 'lxc' }))];
    }

    async controlVM(serverId, node, type, vmid, action) {
        const headers = await this.authenticate(serverId);
        const server = await serverRepository.findById(serverId);
        const agent = this.getAgent(server.ip);

        // action: start, stop, shutdown, reboot, pause, resume
        const response = await agent.post(`/nodes/${node}/${type}/${vmid}/status/${action}`, {}, { headers });
        return response.data;
    }
}

module.exports = new ProxmoxService();
