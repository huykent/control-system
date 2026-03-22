/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const { NodeSSH } = require('node-ssh');
const sshKeyRepository = require('../repositories/sshKeyRepository');

class SshService {
    constructor() {
        this.connections = new Map();
    }

    async getConnection(server) {
        if (this.connections.has(server.id)) {
            const conn = this.connections.get(server.id);
            if (conn.isConnected()) return conn;
        }

        const ssh = new NodeSSH();
        const config = {
            host: server.ip,
            port: server.port || 22,
            username: server.username,
        };

        if (server.auth_type === 'password') {
            config.password = server.password;
        } else if (server.auth_type === 'key' && server.ssh_key_id) {
            const keyRecord = await sshKeyRepository.findById(server.ssh_key_id);
            if (!keyRecord) throw new Error('SSH Key not found');
            config.privateKey = keyRecord.private_key;
        } else {
            throw new Error('Invalid authentication method');
        }

        await ssh.connect(config);
        this.connections.set(server.id, ssh);
        return ssh;
    }

    async execCommand(server, command) {
        try {
            const ssh = await this.getConnection(server);
            const result = await ssh.execCommand(command);
            return {
                stdout: result.stdout,
                stderr: result.stderr,
                code: result.code
            };
        } catch (err) {
            console.error(`SSH command error on ${server.ip}:`, err);
            throw err;
        }
    }

    async closeConnection(serverId) {
        if (this.connections.has(serverId)) {
            this.connections.get(serverId).dispose();
            this.connections.delete(serverId);
        }
    }
}

module.exports = new SshService();
