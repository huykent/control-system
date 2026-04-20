const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();
async function run() {
    try {
        await ssh.connect({ host: '192.168.0.65', username: 'hitpro', password: 'Thanhnga1994' });
        const cmd = process.argv.slice(2).join(' ');
        console.log('Running:', cmd);
        const res = await ssh.execCommand(cmd, { cwd: '/home/hitpro/control-system', stream: 'both' });
        console.log('STDOUT:', res.stdout);
        if (res.stderr && !res.stderr.includes('password for hitpro')) {
            console.error('STDERR:', res.stderr);
        }
        ssh.dispose();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
