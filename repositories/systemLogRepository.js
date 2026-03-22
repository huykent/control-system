/**
 * Author: Nguyễn Quang Huy 
 * facebook: https://www.facebook.com/QuangHuy.Nguyennn/
 */
const db = require('../database/db');
const telegramService = require('../services/telegramService');

class SystemLogRepository {
    async create(level, source, message) {
        const sql = 'INSERT INTO system_logs (level, source, message) VALUES (?, ?, ?)';
        const result = await db.run(sql, [level, source, message]);

        if (level === 'error') {
            telegramService.sendAlert(`[${source}] ${message}`);
        }

        return result.id;
    }


    async getRecent(limit = 50) {
        const sql = 'SELECT * FROM system_logs ORDER BY timestamp DESC LIMIT ?';
        return await db.query(sql, [limit]);
    }

    async getRecentErrors(minutes = 10) {
        const sql = `SELECT * FROM system_logs WHERE level = 'error' AND timestamp >= datetime('now', '-${minutes} minutes') ORDER BY timestamp DESC`;
        return await db.query(sql);
    }
}

module.exports = new SystemLogRepository();
