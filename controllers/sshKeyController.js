const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const sshKeyRepository = require('../repositories/sshKeyRepository');
const serverRepository = require('../repositories/serverRepository');
const sshService = require('../services/sshService');

class SshKeyController {
    async list(req, res) {
        try {
            const keys = await sshKeyRepository.findAll();
            res.json({ success: true, data: keys, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }

    async addManual(req, res) {
        try {
            const { name, public_key, private_key } = req.body;
            if (!name || !public_key || !private_key) {
                return res.status(400).json({ success: false, error: 'Name, Public Key, and Private Key are required' });
            }
            const keyRecord = await sshKeyRepository.create({ name, public_key, private_key });
            res.json({ success: true, data: keyRecord });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async generate(req, res) {
        const { name, type = 'ed25519' } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

        const tempDir = os.tmpdir();
        const keyPath = path.join(tempDir, `ssh_key_${Date.now()}`);

        try {
            // Use ssh-keygen for maximum compatibility with servers and clients
            const algorithm = type === 'rsa' ? 'rsa' : 'ed25519';
            const bits = type === 'rsa' ? '-b 4096' : '';

            // Generate key pair (no passphrase)
            execSync(`ssh-keygen -t ${algorithm} ${bits} -N "" -f "${keyPath}" -q`, { windowsHide: true });

            const privateKey = fs.readFileSync(keyPath, 'utf8');
            const publicKey = fs.readFileSync(`${keyPath}.pub`, 'utf8').trim();

            const keyRecord = await sshKeyRepository.create({
                name,
                public_key: publicKey,
                private_key: privateKey
            });

            res.json({ success: true, data: keyRecord, error: null });
        } catch (err) {
            console.error('Error generating SSH key:', err);
            res.status(500).json({ success: false, data: null, error: err.message });
        } finally {
            // Cleanup temp files
            try {
                if (fs.existsSync(keyPath)) fs.unlinkSync(keyPath);
                if (fs.existsSync(`${keyPath}.pub`)) fs.unlinkSync(`${keyPath}.pub`);
            } catch (e) { }
        }
    }

    async getSshStatus(req, res) {
        try {
            const { serverId } = req.params;
            const server = await serverRepository.findById(serverId);
            if (!server) return res.status(404).json({ success: false, error: 'Server not found' });

            // 1. Check sshd_config for Password and Pubkey auth
            const checkConfigCmd = `grep -E "^(PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config || true`;
            const configResult = await sshService.execCommand(server, checkConfigCmd);

            // 2. Check authorized_keys content
            const checkKeysCmd = `cat ~/.ssh/authorized_keys 2>/dev/null || echo ""`;
            const keysResult = await sshService.execCommand(server, checkKeysCmd);

            const status = {
                passwordAuth: configResult.stdout.includes('PasswordAuthentication yes'),
                pubkeyAuth: configResult.stdout.includes('PubkeyAuthentication yes') || !configResult.stdout.includes('PubkeyAuthentication no'), // default is usually yes
                authorizedKeys: keysResult.stdout
            };

            res.json({ success: true, data: status });
        } catch (err) {
            console.error('Error getting SSH status:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async configureSshd(req, res) {
        try {
            const { serverId } = req.body;
            const server = await serverRepository.findById(serverId);
            if (!server) return res.status(404).json({ success: false, error: 'Server not found' });

            // Command to ensure both are 'yes' and restart service
            // Using sed to replace or append if missing
            const command = `
                sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config && \
                sudo sed -i 's/^#*PubkeyAuthentication.*/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
                sudo systemctl restart ssh
            `.trim();

            const result = await sshService.execCommand(server, command);

            if (result.code !== 0) {
                return res.status(500).json({ success: false, error: 'Failed to configure SSHD', details: result.stderr });
            }

            res.json({ success: true, message: 'SSHD configured and restarted successfully' });
        } catch (err) {
            console.error('Error configuring SSHD:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async pushToServer(req, res) {
        try {
            const { id } = req.params;
            const { serverId } = req.body;
            if (!serverId) return res.status(400).json({ success: false, error: 'Server ID is required' });

            const key = await sshKeyRepository.findById(id);
            if (!key) return res.status(404).json({ success: false, error: 'SSH Key not found' });

            const server = await serverRepository.findById(serverId);
            if (!server) return res.status(404).json({ success: false, error: 'Server not found' });

            const pubKey = key.public_key.trim();
            // Secure command to create .ssh, set permissions, and append key if not present
            const command = `mkdir -p ~/.ssh && chmod 700 ~/.ssh && grep -q -F "${pubKey}" ~/.ssh/authorized_keys 2>/dev/null || echo "${pubKey}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`;

            const result = await sshService.execCommand(server, command);

            if (result.code !== 0) {
                return res.status(500).json({ success: false, error: 'Failed to push key to server', details: result.stderr });
            }

            res.json({ success: true, message: 'Key pushed successfully' });
        } catch (err) {
            console.error('Error pushing key to server:', err);
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async download(req, res) {
        try {
            const key = await sshKeyRepository.findById(req.params.id);
            if (!key) return res.status(404).json({ error: 'Key not found' });

            const isRSA = key.private_key.includes('RSA PRIVATE KEY');
            const prefix = isRSA ? 'id_rsa' : 'id_ed25519';
            const filename = `${prefix}_${key.name.replace(/[^a-zA-Z0-9]/g, '_')}.pem`;
            res.setHeader('Content-Type', 'application/x-pem-file');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(key.private_key);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async delete(req, res) {
        try {
            await sshKeyRepository.delete(req.params.id);
            res.json({ success: true, data: { status: 'deleted' }, error: null });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new SshKeyController();
