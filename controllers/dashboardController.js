/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const metricsService = require('../services/metricsService');
const serverRepository = require('../repositories/serverRepository');
const db = require('../database/db');

class DashboardController {
    async getSummary(req, res) {
        try {
            const servers = await serverRepository.findAll();

            // Get total docker containers across all standard nodes (just a sum of docker_containers table)
            const dockerCountRes = await db.query('SELECT COUNT(*) as count FROM docker_containers');
            const dockerCount = dockerCountRes[0].count;

            // Simplified average health/uptime (mock logic for dashboard demo)
            let onlineServers = servers.filter(s => s.status !== 'offline').length; // Changed logic
            let health = servers.length > 0 ? Math.round((onlineServers / servers.length) * 100) : 100;

            // Get history metrics
            const historyData = await db.query(`
                SELECT strftime('%m-%d %H:%M', timestamp) as name, 
                       AVG(cpu) as cpu, 
                       AVG(ram) as ram 
                FROM metrics 
                GROUP BY strftime('%m-%d %H:%M', timestamp) 
                ORDER BY timestamp DESC 
                LIMIT 15
            `);

            // Format for UI (reverse to chronological)
            const formattedHistory = historyData.reverse().map(row => ({
                name: row.name.split(' ')[1], // Only time part
                cpu: parseFloat(row.cpu.toFixed(1)),
                ram: parseFloat(row.ram.toFixed(1))
            }));

            res.json({
                success: true,
                data: {
                    servers: servers.length,
                    containers: dockerCount,
                    health: `${health}%`,
                    uptime: 'Active',
                    history: formattedHistory
                },
                error: null
            });
        } catch (err) {
            res.status(500).json({ success: false, data: null, error: err.message });
        }
    }
}

module.exports = new DashboardController();
