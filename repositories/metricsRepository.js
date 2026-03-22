/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');

class MetricsRepository {
    async create(metricsData) {
        const { server_id, cpu, ram, disk, uptime } = metricsData;
        const sql = `
      INSERT INTO metrics (server_id, cpu, ram, disk, uptime)
      VALUES (?, ?, ?, ?, ?)
    `;
        const result = await db.run(sql, [server_id, cpu, ram, disk, uptime]);
        return result.id;
    }

    async findByServerId(serverId, limit = 50) {
        const sql = `
      SELECT * FROM metrics 
      WHERE server_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ?
    `;
        return await db.query(sql, [serverId, limit]);
    }

    async getLatestByServerId(serverId) {
        const sql = `
      SELECT * FROM metrics 
      WHERE server_id = ? 
      ORDER BY timestamp DESC 
      LIMIT 1
    `;
        return await db.get(sql, [serverId]);
    }

    async deleteOldMetrics(days = 7) {
        const sql = "DELETE FROM metrics WHERE timestamp < DATETIME('now', ?)";
        const result = await db.run(sql, [`-${days} days`]);
        return result.changes;
    }
}

module.exports = new MetricsRepository();
