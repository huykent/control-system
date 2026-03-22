const { exec } = require('child_process');
const db = require('../database/db');

class LanScanner {
    setIo(io) {
        this.io = io;
    }

    async scan(range) {
        // range: e.g., '192.168.1.0/24'
        return new Promise((resolve, reject) => {
            // Use arp-scan or nmap if available. For the purpose of this project, 
            // we'll use a shell command and parse the output.
            const cmd = `arp-scan --localnet`;

            exec(cmd, async (error, stdout, stderr) => {
                if (error) {
                    console.warn('arp-scan failed, trying alternative (ping sweep)...');
                    // Fallback to a simple ping sweep simulation or actual nmap
                    return resolve(await this.pingSweep(range));
                }

                const hosts = this.parseArpScan(stdout);
                await this.syncDiscovered(hosts);
                resolve(hosts);
            });
        });
    }

    parseArpScan(output) {
        const lines = output.split('\n');
        const hosts = [];
        const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\s+([0-9a-f:]{17})\s+(.+)/i;

        for (const line of lines) {
            const match = line.match(ipRegex);
            if (match) {
                hosts.push({
                    ip: match[1],
                    mac: match[2],
                    vendor: match[3].trim()
                });
            }
        }
        return hosts;
    }

    async pingSweep(range) {
        // Fallback to 'arp -a' mainly for Windows or basic discovery
        return new Promise((resolve) => {
            exec('arp -a', async (error, stdout, stderr) => {
                if (error) {
                    return resolve([]);
                }
                const lines = stdout.split('\n');
                const hosts = [];
                // Match standard ARP output on Windows/Linux
                const ipRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/;
                const macRegex = /([0-9a-fA-F:-]{17})/;

                for (const line of lines) {
                    const ipMatch = line.match(ipRegex);
                    const macMatch = line.match(macRegex);
                    if (ipMatch && macMatch) {
                        const ip = ipMatch[1];
                        const mac = macMatch[1].replace(/-/g, ':').toLowerCase();
                        // Ignore broadcast and multicast
                        if (!ip.endsWith('.255') && !ip.startsWith('224.') && !mac.includes('ff:ff:ff:ff:ff:ff')) {
                            hosts.push({ ip, mac, vendor: 'Unknown' });
                        }
                    }
                }

                // Remove duplicates
                const uniqueHosts = Array.from(new Map(hosts.map(item => [item.ip, item])).values());

                // Immediately save what we have as "Unknown" 
                await this.syncDiscovered(uniqueHosts);

                // Emitting real-time updates via Socket.IO
                if (this.io) {
                    this.io.emit('discovery:start', uniqueHosts);
                }

                // Unblock HTTP request early so frontend gets fast response
                resolve(uniqueHosts);

                // Lookup MAC Vendors in background
                const axios = require('axios');
                for (let host of uniqueHosts) {
                    try {
                        const response = await axios.get(`https://api.maclookup.app/v2/macs/${host.mac}`, { timeout: 2000 });
                        if (response.data && response.data.success && response.data.company) {
                            host.vendor = response.data.company;
                            await this.syncDiscovered([host]); // update just this host in DB

                            // Emit update for partial real-time magic feeling
                            if (this.io) {
                                this.io.emit('discovery:host_updated', host);
                            }
                        }
                    } catch (e) { }
                }

                if (this.io) {
                    this.io.emit('discovery:done');
                }
            });
        });
    }

    async syncDiscovered(hosts) {
        for (const host of hosts) {
            const sql = 'INSERT OR REPLACE INTO discovered_hosts (ip, mac, vendor, last_seen) VALUES (?, ?, ?, CURRENT_TIMESTAMP)';
            await db.run(sql, [host.ip, host.mac, host.vendor]);
        }
    }

    async getDiscovered() {
        return await db.query('SELECT * FROM discovered_hosts ORDER BY last_seen DESC');
    }
}

module.exports = new LanScanner();
