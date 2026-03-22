const { Client } = require('ssh2');
const serverRepository = require('../repositories/serverRepository');
const sshKeyRepository = require('../repositories/sshKeyRepository');

function setupTerminalSocket(io) {
    const terminalNamespace = io.of('/terminal');

    terminalNamespace.on('connection', (socket) => {
        console.log('Terminal socket connected:', socket.id);
        let sshClient = null;
        let sshStream = null;

        socket.on('terminal:start', async ({ serverId, cols, rows }) => {
            try {
                const server = await serverRepository.findById(serverId);
                if (!server) {
                    socket.emit('terminal:error', 'Server not found');
                    return;
                }

                sshClient = new Client();

                sshClient.on('ready', () => {
                    sshClient.shell({ term: 'xterm-256color', cols, rows }, (err, stream) => {
                        if (err) {
                            socket.emit('terminal:error', 'Failed to start shell: ' + err.message);
                            return;
                        }
                        sshStream = stream;

                        stream.on('data', (data) => {
                            socket.emit('terminal:data', data.toString());
                        });

                        stream.on('close', () => {
                            socket.emit('terminal:closed');
                            sshClient.end();
                        });
                    });
                });

                sshClient.on('error', (err) => {
                    socket.emit('terminal:error', 'SSH Client error: ' + err.message);
                });

                const config = {
                    host: server.ip,
                    port: server.port || 22,
                    username: server.username,
                };

                if (server.auth_type === 'password') {
                    config.password = server.password;
                } else if (server.auth_type === 'key' && server.ssh_key_id) {
                    const keyRecord = await sshKeyRepository.findById(server.ssh_key_id);
                    if (keyRecord) {
                        config.privateKey = keyRecord.private_key;
                    }
                }

                sshClient.connect(config);

            } catch (err) {
                socket.emit('terminal:error', err.message);
            }
        });

        socket.on('terminal:input', (data) => {
            if (sshStream) {
                sshStream.write(data);
            }
        });

        socket.on('terminal:resize', ({ cols, rows }) => {
            if (sshStream) {
                sshStream.setWindow(rows, cols);
            }
        });

        socket.on('disconnect', () => {
            if (sshStream) sshStream.end();
            if (sshClient) sshClient.end();
            console.log('Terminal socket disconnected:', socket.id);
        });
    });
}

module.exports = setupTerminalSocket;
