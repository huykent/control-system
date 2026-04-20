const { NodeSSH } = require('node-ssh');
const path = require('path');
const fs = require('fs');

const ssh = new NodeSSH();
const srcDir = path.resolve(__dirname, '../../');
const destDir = '/home/hitpro/control-system';

async function deploy() {
    try {
        console.log('Connecting to VPS 192.168.0.65 as hitpro...');
        await ssh.connect({
            host: '192.168.0.65',
            username: 'hitpro',
            password: 'Thanhnga1994',
            readyTimeout: 10000
        });

        console.log('Connected! Creating destination directory...');
        await ssh.execCommand(`mkdir -p ${destDir}`);

        console.log(`Uploading files from ${srcDir} to ${destDir} (this may take a while)...`);
        let uploadCount = 0;
        await ssh.putDirectory(srcDir, destDir, {
            recursive: true,
            concurrency: 10,
            validate: function (itemPath) {
                const normalized = itemPath.replace(/\\/g, '/');
                if (normalized.includes('/node_modules') ||
                    normalized.includes('/.git') ||
                    normalized.includes('/data/') ||
                    normalized.includes('/artifacts/') ||
                    normalized.includes('/.venv') ||
                    normalized.includes('/.agent') ||
                    itemPath === destDir // edge case
                ) {
                    return false;
                }
                return true;
            },
            tick: function (localPath, remotePath, error) {
                if (error) {
                    console.error('Failed copying: ', localPath, error);
                } else {
                    uploadCount++;
                    if (uploadCount % 100 === 0) {
                        console.log(`Uploaded ${uploadCount} files...`);
                    }
                }
            }
        });

        console.log(`Upload complete! Total files uploaded: ${uploadCount}`);

        console.log('Running docker compose on VPS...');
        const result = await ssh.execCommand('docker compose up -d --build --force-recreate', {
            cwd: destDir,
            stream: 'both'
        });

        console.log('Docker Output:');
        console.log(result.stdout);
        if (result.stderr && !result.stderr.includes('Password:')) {
            console.error('Docker Error/Warn:', result.stderr);
        }

        console.log('Deployment script finished successfully!');
        ssh.dispose();
    } catch (err) {
        console.error('Deployment failed:', err);
        ssh.dispose();
        process.exit(1);
    }
}

deploy();
